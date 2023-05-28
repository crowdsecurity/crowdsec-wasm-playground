package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"syscall/js"

	"github.com/crowdsecurity/grokky"
	"github.com/davecgh/go-spew/spew"
)

var Grok grokky.Host

var AllGrokPatternsURL = "https://gist.githubusercontent.com/buixor/cb571dd8c4a9c8a749bd89ee824f77da/raw/69efc233439bfba086fea14521c06455276665b9/grok_patterns.txt"

func grokInit(this js.Value, args []js.Value) interface{} {

	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {

		resolve := args[0]
		reject := args[1]
		//The HTTP request must be done in a goroutine, or else we are blocking the event loop
		//Leading to a deadlock
		//We return a promise, so we can use .then() in JS
		go func() {
			fmt.Printf("loading all them grok patterns\n")
			Grok = grokky.NewBase()
			var body []byte
			// Get the data
			resp, err := http.Get(AllGrokPatternsURL)
			if err != nil {
				errorConstructor := js.Global().Get("Error")
				errorObject := errorConstructor.New("error while downloading grok patterns : " + err.Error())
				reject.Invoke(errorObject)
				return
			}
			defer resp.Body.Close()

			body, err = ioutil.ReadAll(resp.Body)
			if err != nil {
				errorConstructor := js.Global().Get("Error")
				errorObject := errorConstructor.New("error while reading grok patterns : " + err.Error())
				reject.Invoke(errorObject)
				return
			}
			fmt.Printf("loaded %d bytes\n", len(body))
			idx := 0
			scanner := bufio.NewScanner(strings.NewReader(string(body)))
			for scanner.Scan() {
				line := scanner.Text()
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
			resolve.Invoke("ok")
			return
		}()
		return nil
	})

	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)

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
	SubMatchIndexes  [][]int
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

		//just for the debug, but we need to return those:
		submatch_indexes := runtimeRx.FindStringSubmatchIndex(input)
		//we are going to "just" extract the indexes to highligh them :)
		for i := 2; i < len(submatch_indexes); i += 2 {
			if submatch_indexes[i] != -1 {
				couple := []int{submatch_indexes[i], submatch_indexes[i+1]}
				found := false
				for _, v := range ret.SubMatchIndexes {
					if v[0] == couple[0] && v[1] == couple[1] {
						found = true
						break
					}
				}
				if !found {
					ret.SubMatchIndexes = append(ret.SubMatchIndexes, couple)
				}
			}
		}
		fmt.Println(submatch_indexes)
		fmt.Printf("stored submatche indexes: %v\n", ret.SubMatchIndexes)
		submatches := runtimeRx.FindAllStringSubmatch(input, 1)
		fmt.Printf("captures: %q\n", submatches)
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

func main() {
	fmt.Println("yolo")
	js.Global().Set("grokInit", js.FuncOf(grokInit))
	js.Global().Set("validateGrok", js.FuncOf(validateGrok))
	js.Global().Set("runGrok", js.FuncOf(runGrok))
	js.Global().Set("debugGrok", js.FuncOf(debugGrok))
	js.Global().Set("getGrokPatterns", js.FuncOf(getGrokPatterns))
	js.Global().Set("addPattern", js.FuncOf(addPattern))

	<-make(chan bool)

}
