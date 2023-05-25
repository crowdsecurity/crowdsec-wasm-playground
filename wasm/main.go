package main

import (
	"bufio"
	"fmt"
	"net/http"
	"strings"
	"syscall/js"

	"github.com/crowdsecurity/grokky"
	"github.com/davecgh/go-spew/spew"
)

var Grok grokky.Host

var AllGrokPatternsURL = "https://gist.githubusercontent.com/buixor/cb571dd8c4a9c8a749bd89ee824f77da/raw/69efc233439bfba086fea14521c06455276665b9/grok_patterns.txt"

func grokInit() error {
	fmt.Printf("loading all them grok patterns\n")
	Grok = grokky.NewBase()
	// Get the data
	resp, err := http.Get(AllGrokPatternsURL)
	if err != nil {
		fmt.Printf("error while downloading grok patterns : %s\n", err)
		return err
	}
	defer resp.Body.Close()

	// Read the body
	r := bufio.NewReader(resp.Body)
	idx := 0
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			fmt.Printf("error while reading grok patterns : %s\n", err)
			break
		}
		name := strings.Split(line, " ")[0]
		patt := strings.Join(strings.Split(line, " ")[1:], " ")
		if err := Grok.Add(name, patt); err != nil {
			fmt.Printf("error while adding grok pattern %s : %s\n", name, err)
		}
		idx++
		if idx%10 == 0 {
			fmt.Printf("loaded %d patterns\n", idx)
		}
	}
	fmt.Printf("loaded ALL %d patterns\n", idx)

	return nil
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
	IdxStart, IdxEnd int
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
		fmt.Printf("'%s' matches '%s'\n", pattern, input)
		tmp_capture := runtimeRx.Parse(input)
		for k, v := range tmp_capture {
			ret.Match[k] = v
		}

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
		fmt.Printf("idx=%d\n", idx)
		if pattern[idx] == '\\' {
			idx++
			continue
		}
		//we got a break : space or '%{' or end of string
		if (pattern[idx] == ' ') ||
			(len(pattern) > idx+1 && pattern[idx] == '%' && pattern[idx+1] == '{') ||
			(len(pattern) == idx+1) {
			//we got a pattern
			subpattern := pattern[:idx]
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
				fmt.Printf("we cannot match, let's stop here and return the previous match (idx=%d)\n", prev_idx)
				return finalret
			}
		}
		idx++
	}

	//we actually matched nothing
	if prev_idx == 0 {
		fmt.Printf("we matched nothing!\n")
		finalret["__idx"] = 0
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

func main() {
	fmt.Println("yolo")
	grokInit()
	js.Global().Set("validateGrok", js.FuncOf(validateGrok))
	js.Global().Set("runGrok", js.FuncOf(runGrok))
	js.Global().Set("debugGrok", js.FuncOf(debugGrok))

	<-make(chan bool)

}
