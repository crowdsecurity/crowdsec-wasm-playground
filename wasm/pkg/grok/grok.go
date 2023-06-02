package grok

import (
	"bufio"
	"embed"
	"encoding/json"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/crowdsecurity/grokky"
	"github.com/davecgh/go-spew/spew"
)

var Grok grokky.Host

//go:embed patterns/*
var f embed.FS

func addFromLine(line string) error {
	name := strings.Split(line, " ")[0]
	patt := strings.Join(strings.Split(line, " ")[1:], " ")
	if err := Grok.Add(name, patt); err != nil {
		fmt.Printf("error while adding grok pattern %s : %s\n", name, err)
		return err
	}
	return nil
}

func grokInit(this js.Value, args []js.Value) interface{} {
	Grok = grokky.NewBase()
	patternFiles, err := f.ReadDir("patterns")

	if err != nil {
		fmt.Printf("error while reading embedded patterns : %s\n", err)
		return map[string]interface{}{"error": err.Error()}
	}

	for _, patternFile := range patternFiles {
		fmt.Printf("loading pattern %s\n", patternFile.Name())
		fd, err := f.Open("patterns/" + patternFile.Name())
		if err != nil {
			fmt.Printf("error while reading embedded pattern %s : %s\n", patternFile.Name(), err)
			return map[string]interface{}{"error": err.Error()}
		}
		//We cannot use grok.AddFromFile because we use embedded files
		scanner := bufio.NewScanner(fd)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "#") {
				continue
			}
			if strings.TrimSpace(line) == "" {
				continue
			}
			if err := addFromLine(scanner.Text()); err != nil {
				return err
			}
		}
		fd.Close()
		if err := scanner.Err(); err != nil {
			fmt.Printf("error while reading embedded pattern %s : %s\n", patternFile.Name(), err)
			return map[string]interface{}{"error": err.Error()}
		}
	}
	fmt.Printf("loaded ALL %d patterns\n", len(patternFiles))
	return map[string]interface{}{"success": true}
}

// func validateGrok(pattern string) error {
func validateGrok(this js.Value, args []js.Value) any {
	if len(args) != 1 {
		return fmt.Errorf("Invalid no of arguments passed")
	}
	pattern := args[0].String()
	_, err := Grok.Compile(pattern)
	if err != nil {
		return "not ok : " + err.Error()
	}
	return "ok boii"
}

//^toto %{IP:toto} foobar lol
//toto 1.2.3.4 rarta
//toto 1.2.3.4 foobar rara
//toto 1.2.3.4 foobar lol
//toto 1.2.3.4 foobar lol 42

//^toto %{IP:toto} %{IP:foobar} tutu lol
//toto 1.2.3.4 5.6.7.8 xxx
//toto 1.2.3.4 5.6.7.8 tutu lol

func debugGrok(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{"_error": "Invalid no of arguments passed"}
	}
	pattern := args[0].String()
	input := args[1].String()
	return subdebugGrok(input, pattern)

}

type PartialMatch struct {
	Compiles         bool
	Matches          bool
	Match            map[string]interface{}
	SubMatchIndexes  map[string][]int
	IdxStart, IdxEnd int
}

// type sortIdxArray interface {
// 	Len() int
// 	Less(i, j int) bool
// 	Swap(i, j int)
// }\

type matchedIdxArray [][]int

func (s matchedIdxArray) Len() int {
	return len(s)
}

func (s matchedIdxArray) Less(i, j int) bool {
	return s[i][0] < s[j][0]
}

func (s matchedIdxArray) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// returns : IS_VALID_PATTERN, MATCHES, MATCH_RESULT
func isSubPattternOk(pattern string, input string) PartialMatch {
	var ret PartialMatch
	ret.Match = map[string]interface{}{}

	_, err := Grok.Compile(pattern)
	if err != nil {
		fmt.Printf("subpattern '%s' is INVALID\n", pattern)
		return ret
	}
	ret.Compiles = true
	runtimeRx, err := Grok.Compile(pattern)
	ret.Matches = runtimeRx.Match([]byte(input))
	//it matches, keep the capture(s) and indexes
	if ret.Matches {
		loc := runtimeRx.FindStringIndex(input)
		if len(loc) == 2 {
			ret.IdxStart = loc[0]
			ret.IdxEnd = loc[1]
		} else {
			fmt.Printf("wtf not 2 indexes ?\n")
		}
		fmt.Printf("'%s' matches (%d - %d)\n", pattern, ret.IdxStart, ret.IdxEnd)
		tmp_capture := runtimeRx.Parse(input)
		submatch_indexes := runtimeRx.FindStringSubmatchIndex(input)
		//get the index map
		submatch_map := runtimeRx.GetIndexes()
		for k, v := range tmp_capture {
			ret.Match[k] = v
		}
		fmt.Printf("full indexes : %v\n", submatch_indexes)
		fmt.Printf("submatch map : %v\n", submatch_map)
		ret.SubMatchIndexes = map[string][]int{}
		for k, vidx := range submatch_map {

			fmt.Printf("name (%s) ->  %d -> %v\n", k, vidx, submatch_indexes[vidx*2:vidx*2+2])
			couple := []int{submatch_indexes[vidx*2], submatch_indexes[vidx*2+1]}
			//there wasn't a match for this group
			if couple[0] == -1 || couple[1] == -1 {
				continue
			}
			ret.SubMatchIndexes[k] = couple
		}
		//let's now sort the array of indexes
		//sort.Sort(matchedIdxArray(ret.SubMatchIndexes))
		return ret
	}
	fmt.Printf("'%s' does not match '%s'\n", pattern, input)
	return ret

}

// return the latest matching index in the pattern. If full match, return -1
func subdebugGrok(input string, pattern string) map[string]interface{} {

	var finalret = map[string]interface{}{}

	idx := 0
	prev_idx := 0
	var prev_match = map[string]interface{}{}

	fmt.Printf("let's goooooo\n")
	fmt.Printf("intput is '%s'\n", input)
	fmt.Printf("pattern is '%s'\n", pattern)

	for idx < len(pattern) {
		//we got a break : space or '%{' or end of string
		if (pattern[idx] == ' ') ||
			(len(pattern) > idx+1 && pattern[idx] == '%' && pattern[idx+1] == '{') ||
			(len(pattern)-1 == idx) {
			//we got a pattern
			subpattern := pattern[:idx+1]
			fmt.Printf("subpattern : '%s'\n", subpattern)
			partial := isSubPattternOk(subpattern, input)
			//if we cannot compile it, continue in search of valid pattern
			if !partial.Compiles {
				idx++
				continue
			}
			if partial.Matches {
				prev_idx = idx
				prev_match = partial.Match
				for k, v := range prev_match {
					finalret[k] = v
				}
				finalret["__error"] = ""
				finalret["__idx"] = idx
				//store indexes
				finalret["__idx_start"] = partial.IdxStart
				finalret["__idx_end"] = partial.IdxEnd
				//yes, we need something better, but if I return the array here, wasm crashes, so let's cheat
				x, _ := json.Marshal(partial.SubMatchIndexes)
				finalret["__submatches_idx"] = string(x)

				//we are at the last char of the pattern, we matched everything
				if len(pattern) == idx+1 {
					fmt.Printf("we matched everything idx=%d vs full lenght=%d\n", idx, len(pattern))
					finalret["__idx"] = -1
					return finalret
				}
				idx++
				continue
			} else {
				//we cannot match, let's stop here and return the previous match
				fmt.Printf("we cannot match (idx=%d / len=%d), let's continue and keep the previous match (prev_idx=%d)\n", idx, len(pattern), prev_idx)
				idx++
				continue
				//return finalret
			}
		}
		fmt.Printf("idx=%d / len=%d\n", idx, len(pattern))
		idx++
	}

	//we actually matched nothing
	if prev_idx == 0 {
		fmt.Printf("we matched nothing!\n")
		finalret["__idx"] = 0
		finalret["__error"] = "no match"
		return finalret
	}
	fmt.Printf("we shouldn't be here .... \n")
	return finalret

}

// func runGrok(input string, pattern string) (map[string]string, error) {
func runGrok(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]string{"error": "Invalid no of arguments passed"}
	}
	pattern := args[0].String()
	input := args[1].String()
	runtimeRx, err := Grok.Compile(pattern)
	if err != nil {
		return map[string]string{"error": err.Error()}
	}
	fmt.Printf("pattern '%s' : OK\n", pattern)

	ret := runtimeRx.Parse(input)

	retiface := map[string]interface{}{}
	for k, v := range ret {
		retiface[k] = v
	}
	fmt.Printf("result %s\n", spew.Sdump(retiface))
	return retiface
}

func getGrokPatterns(this js.Value, args []js.Value) interface{} {
	ret := map[string]interface{}{}
	fmt.Printf("getGrokPatterns\n")
	fmt.Printf("loaded %d patterns\n", len(Grok.Patterns))
	for k, v := range Grok.Patterns {
		ret[k] = v
	}
	return ret
}

func addPattern(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]string{"error": "Invalid no of arguments passed"}
	}
	name := args[0].String()
	expr := args[1].String()
	err := Grok.Add(name, expr)
	if err != nil {
		fmt.Printf("error while adding grok pattern %s : %s\n", name, err)
		return map[string]interface{}{"error": err.Error()}
	}
	return map[string]interface{}{"success": true}
}

/*func deletePattern(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]string{"error": "Invalid no of arguments passed"}
	}
	name := args[0].String()
	err := Grok.Delete(name)
	if err != nil {
		fmt.Printf("error while deleting grok pattern %s : %s\n", name, err)
		return map[string]interface{}{"error": err.Error()}
	}
	return map[string]interface{}{"success": true}
}*/

func RegisterJSFuncs() {
	js.Global().Set("grokInit", js.FuncOf(grokInit))
	js.Global().Set("validateGrok", js.FuncOf(validateGrok))
	js.Global().Set("runGrok", js.FuncOf(runGrok))
	js.Global().Set("debugGrok", js.FuncOf(debugGrok))
	js.Global().Set("getGrokPatterns", js.FuncOf(getGrokPatterns))
	js.Global().Set("addPattern", js.FuncOf(addPattern))
	//js.Global().Set("deletePattern", js.FuncOf(deletePattern))
}
