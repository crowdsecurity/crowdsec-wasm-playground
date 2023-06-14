import React, { useRef } from 'react';

import Button from '@mui/base/Button';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Alert, InputLabel } from '@mui/material';
import { styled } from '@mui/system';
import { Grid } from '@mui/material';
import Item from '@mui/material/Grid';
import GrokLibrary from '../grokLibrary/grokLibrary';
import RichTextDisplay from '../richTextDisplay/richtextdisplay';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Table } from "@mui/material";
import { TableHead } from "@mui/material";
import { TableRow } from "@mui/material";
import { TableCell } from "@mui/material";
import { TableBody } from "@mui/material";
import { Paper } from "@mui/material";
import { TableContainer } from "@mui/material";
import Box from '@mui/material/Box';
import "./style.css";
import getCaretCoordinates from 'textarea-caret';

const StyledTextarea = styled(TextareaAutosize)({
	width: '95%',
	borderRadius: '25px',
	padding: '12px 24px',
	border: '1px solid #ccc',
	'&:focus': {
		borderColor: 'black',
		outline: 'none',
	},
});

const GrokPatternExamples = {
	"nginx": {
		"pattern": `(%{IPORHOST:target_fqdn} )?%{IPORHOST:remote_addr} - (%{NGUSER:remote_user})? \\[%{HTTPDATE:time_local}\\] "%{WORD:verb} %{DATA:request} HTTP/%{NUMBER:http_version}" %{NUMBER:status} %{NUMBER:body_bytes_sent} "%{NOTDQUOTE:http_referer}" "%{NOTDQUOTE:http_user_agent}"( %{NUMBER:request_length} %{NUMBER:request_time} \\[%{DATA:proxy_upstream_name}\\] \\[%{DATA:proxy_alternative_upstream_name}\\])?`,
		"input": `1.2.3.4 - - [31/May/2023:16:45:28 +0000] "GET /upload/server/php/ HTTP/1.1" 301 178 "-" "python-requests/2.31.0"`
	},
	"simple": {
		"pattern": "%{WORD:foo} %{WORD:bar}",
		"input": "hello world"
	},
	"": {
		"pattern": "",
		"input": ""
	}
}

/*
console.log("idx => ", idx , " type => ", typeof idx)
		console.log("ret => ", ret , " type => ", typeof ret)
		console.log("error => ", error , " type => ", typeof error)
		console.log("start_idx => ", start_idx , " type => ", typeof start_idx)
		console.log("end_idx => ", end_idx , " type => ", typeof end_idx)
		console.log("submatch indexes => ", submatch_indexes , " type => ", typeof submatch_indexes)

*/

var submatch_group_colors = ['yellow', 'cyan', 'pink', 'orange']

function renderPattern(end_idx, pattern, submatch_idx) {
	let patternStyles = []
	let insubmatch = false
	let submatch_name = ""
	//let submatch_idx = 0

	//-1 means full match
	if (end_idx === -1) {
		console.log("full match!")
		end_idx = pattern.length
	}

	for (let i = 0; i < pattern.length; i++) {
		if (i > end_idx) {
			//console.log("after pattern")
			patternStyles.push(
				{ text: pattern[i], style: { color: 'red', fontWeight: 'bold' } }
			)
			continue
		}

		//identify if we're in or out of a submatch
		if (pattern[i] === "%" && pattern[i + 1] === "{") {
			//console.log("entering submatch %d", submatch_idx)
			//extract the name of the subgroup, and see if it matched

			let capture_name_start = pattern.indexOf(":", i + 2)
			submatch_name = pattern.substring(capture_name_start + 1, pattern.indexOf("}", capture_name_start + 1))
			//console.log("entering submatch %s => %s", submatch_name, Object.keys(submatch_idx))
			if (submatch_name in submatch_idx) {
				//console.log("submatch %s is go", submatch_name)
				insubmatch = true
			}
		}

		if (insubmatch === true && pattern[i - 1] === "}" && pattern[i - 2] !== "\\") {
			insubmatch = false
			//console.log("leaving submatch %d", submatch_name)
		}

		if (insubmatch === true) {
			//console.log("in submatch %d", submatch_idx)
			patternStyles.push(
				{ text: pattern[i], style: { color: 'green', fontWeight: 'bold', backgroundColor: colorFromKey(submatch_name) } }
			)
			continue
		}

		//we're not in a submatch, but we're matched
		//console.log("in match")
		patternStyles.push(
			{ text: pattern[i], style: { color: 'green', fontWeight: 'bold' } }
		)
	}
	return patternStyles
}

function colorFromKey(key) {
	var output = 0
	for (var i = 0, len = key.length; i < len; i++) {
		output += key[i].charCodeAt(0)
	}
	return submatch_group_colors[output % submatch_group_colors.length]
}

//render the text with the correct color
function renderText(start_idx, end_idx, submatch_idx, text) {
	let dataStyles = []

	nextchar:
	for (let i = 0; i < text.length; i++) {
		//The char isn't matched
		if (i < start_idx || i >= end_idx) {
			dataStyles.push(
				{ text: text[i], style: { color: 'red', fontWeight: 'bold' } }
			)
			continue
		}
		//Is the char part of a submatch ?

		for (const [k, indexes] of Object.entries(submatch_idx)) {
			if (i >= indexes[0] && i < indexes[1]) {
				//console.log("char %d is part of submatch %s", i, k)
				dataStyles.push(
					{ text: text[i], style: { color: 'green', fontWeight: 'bold', backgroundColor: colorFromKey(k) } }
				)
				continue nextchar
			}
		}
		//console.log("char %d is not part of submatch", i)
		//The char is matched, but not part of a submatch
		dataStyles.push(
			{ text: text[i], style: { color: 'green', fontWeight: 'bold' } }
		)

	}
	return dataStyles
}

const CustomTableCell = styled(TableCell)(({ color }) => ({
	backgroundColor: color,
  }));

  

const GrokDebugger = () => {
	const [outputDictValue, setOutputDictValue] = React.useState([]);
	const [error, setError] = React.useState('');
	const [grokStyles, setGrokStyles] = React.useState([]);
	const [dataStyles, setDataStyles] = React.useState([]);
	const [grokExample, setGrokExample] = React.useState('')
	const [inputPosition, setInputPosition] = React.useState({ top: 0, left: 0 });

	const patternValue = useRef("");
	const inputValue = useRef("");
	const isInGrokPattern = useRef(false);
	const loadedGrokPatterns = useRef({});
	const [suggestedPatterns, setSuggestedPatterns] = React.useState([]);
	var evaled = useRef(false);

	const columns = [
		{ title: 'Pattern', field: 'pattern' },
		{ title: 'Value', field: 'value' },
	];

	const handleExampleChange = (e) => {
		if (e === null) {
			return
		}
		setGrokExample(e.target.value)
		const examplePattern = GrokPatternExamples[e.target.value]["pattern"];
		const exampleInput = GrokPatternExamples[e.target.value]["input"];
		patternValue.current.value = examplePattern;
		inputValue.current.value = exampleInput;
	}

	const refreshGrokPatterns = (patterns) => {
		loadedGrokPatterns.current = patterns
		console.log("patterns: ", patterns)
	}

	const HandleClick = () => {
		evaled.current = true;
		setError('')
		var ret = window.debugGrok(patternValue.current.value, inputValue.current.value)

		console.log(ret)

		var idx = ret["__idx"]
		delete ret["__idx"]
		var error = ret["__error"]
		delete ret["__error"]
		var start_idx = ret["__idx_start"]
		delete ret["__idx_start"]
		var end_idx = ret["__idx_end"]
		delete ret["__idx_end"]

		if (error) {
			setError(error)
			return
		}

		if ("__submatches_idx" in ret) {
			var submatch_indexes = JSON.parse(ret["__submatches_idx"])
			delete ret["__submatches_idx"]
		}

		console.log("idx => ", idx, " type => ", typeof idx)
		console.log("ret => ", ret, " type => ", typeof ret)
		console.log("error => ", error, " type => ", typeof error)
		console.log("start_idx => ", start_idx, " type => ", typeof start_idx)
		console.log("end_idx => ", end_idx, " type => ", typeof end_idx)
		console.log("submatch indexes => ", submatch_indexes, " type => ", typeof submatch_indexes)

		if (idx !== undefined) {
			if (ret !== undefined) {
				//we want to have consistent order in the table, so we rely on the submatch_index to order the table.
				let mykeys = Object.keys(submatch_indexes)
				mykeys.sort(function (a, b) {
					return submatch_indexes[a][0] - submatch_indexes[b][0];
				});

				let data = []
				for (let i = 0; i < mykeys.length; i++) {
					let key = mykeys[i]
					data.push({ pattern: key, value: ret[key], color: colorFromKey(key), idx: mykeys.indexOf(key) })
				}

				setOutputDictValue(data)
			}

			setDataStyles(renderText(start_idx, end_idx, submatch_indexes, inputValue.current.value))
			setGrokStyles(renderPattern(idx, patternValue.current.value, submatch_indexes))
		}
	}

	const HandlePatternChange = (e) => {
		var currentValue = e.target.value;
		var currentCursorPos = e.target.selectionStart;
		if (currentCursorPos < 2) {
			isInGrokPattern.current = false;
			return;
		}
		if (currentValue[currentCursorPos - 1] === '{' && currentValue[currentCursorPos - 2] === '%') {
			console.log("found start of grok pattern");
			isInGrokPattern.current = true;
		}
		if (currentValue[currentCursorPos - 1] === '}') {
			console.log("found end of grok pattern");
			isInGrokPattern.current = false;
		}

		if (isInGrokPattern.current) {
			var startPattern = currentValue.lastIndexOf('%{') + 2;
			var grokPatternStart = currentValue.substring(startPattern, currentCursorPos);
			console.log("checking for pattern start: ", grokPatternStart, " in: ", Object.keys(loadedGrokPatterns.current))
			setSuggestedPatterns(Object.keys(loadedGrokPatterns.current).filter(pattern => pattern.startsWith(grokPatternStart)).sort().slice(0, 5));

			var {top, left} = getCaretCoordinates(e.target, e.target.selectionEnd);

			var textAreaCoords = e.target.getBoundingClientRect();

			top = top + textAreaCoords.top + 20;
			left = left + textAreaCoords.left;

			console.log("top: ", top, " left: ", left)
			// Set input position for floating suggestions window
			setInputPosition({
				top: top,
				left: left,
			  });
			  console.log(e.key)
			  if (e.keyCode === 9 && suggestedPatterns.length > 0) {
				e.preventDefault();
				handlePatternSuggestionClick(suggestedPatterns[0]);
			  }
		}
		else {
			setSuggestedPatterns([]); // Clear suggestions
		}
	};


	const handlePatternSuggestionClick = (pattern) => {
		var currentValue = patternValue.current.value;
		var currentCursorPos = patternValue.current.selectionStart;

		var precedingText = currentValue.substring(0, currentCursorPos);
		var followingText = currentValue.substring(currentCursorPos);


		console.log("precedingText: ", precedingText)
		console.log("followingText: ", followingText)

		var lastPatternStart = precedingText.lastIndexOf('%{') + 2;
		var nextPatternEnd = followingText.indexOf('}') + currentCursorPos + 1;

		console.log("lastPatternStart: ", lastPatternStart, "(", precedingText[lastPatternStart], ")")
		console.log("nextPatternEnd: ", nextPatternEnd, "(", followingText[nextPatternEnd], ")")


		console.log("before ", currentValue.substring(0, lastPatternStart))
		console.log("pattern: ", pattern)
		console.log("after ", currentValue.substring(nextPatternEnd))

		var before = currentValue.substring(0, lastPatternStart)
		var after = currentValue.substring(nextPatternEnd)

		var newValue = before + pattern + after;

		patternValue.current.value = newValue;

		// Clear suggestions
		setSuggestedPatterns([]);
	};

	const renderPatternEvaluationResults = () => {
		console.log("evaled: ", evaled)		
		if (evaled.current === false) {
			return null;
		}
		return (
			<>
			<h2> Grok Pattern results </h2>
			<Box component="div" sx={{ p: 2, border: '1px dashed grey' }}>
			<RichTextDisplay styles={grokStyles} />
			</Box>
			<h2> Match data results </h2>
			<Box component="div" sx={{ p: 2, border: '1px dashed grey' }}>
			<RichTextDisplay styles={dataStyles} /> 
			</Box>
			<h1>Output</h1>
			<Box display="flex" justifyContent="center" maxWidth="50%" margin="0 auto">
				<TableContainer className="darkGreyBold" component={Paper}>
					<Table aria-label="simple table" size="small" width="50%">
						<TableHead>
							<TableRow>
								{columns.map((column) => (<TableCell className="whiteBold" align="center">{column.title}</TableCell>))}
							</TableRow>
						</TableHead>
						<TableBody>

							{outputDictValue.filter(
								(key) => {
									return key.value !== "";
								}).map((row) => (<TableRow key={row.idx}>
									<CustomTableCell color={row.color} className="darkGreyBold" align="right">{row.pattern}</CustomTableCell>
									<CustomTableCell color={row.color} className="darkGreyBold" align="center">{row.value}</CustomTableCell>
								</TableRow>))}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
			</>
		)
	}

	return (
		<Grid container spacing={2}>
			<Grid container style={{padding: "20px"}} justifyContent="flex-end">
				<h2>Examples</h2>
				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<InputLabel id="demo-simple-select-label">Example</InputLabel>
					<Select
						labelId="demo-simple-select-label"
						id="demo-simple-select"
						value={grokExample}
						onChange={handleExampleChange}
					>
						<MenuItem value=""><em>None</em></MenuItem>
						<MenuItem value="nginx">Nginx</MenuItem>
						<MenuItem value="simple">Simple</MenuItem>
					</Select>
				</FormControl>
			</Grid>
			<Grid item xs={8} md={8}>
				<Item>
					<div>
						{error && <Alert severity="error">An error occured while processing data: {error}.</Alert>}
						<div align="left"><h1>Pattern</h1></div>
						<StyledTextarea
							minRows={1}
							className="fixed-textarea"
							placeholder="Grok Pattern"
							ref={patternValue}
							onChange={HandlePatternChange}
							onKeyDown={(e) => { if (e.key === 'Tab' && suggestedPatterns.length > 0) { e.preventDefault(); handlePatternSuggestionClick(suggestedPatterns[0]);  } }}
						/>
						<div align="left"><h1>Test Data</h1></div>
						<StyledTextarea
							minRows={3}
							className='fixed-textarea'
							placeholder="Input"
							ref={inputValue}
						/>
						<div><Button variant="contained" onClick={HandleClick}>Run</Button></div>
						{ renderPatternEvaluationResults()}
					</div>
					<div
						style={{
							position: 'absolute',
							top: inputPosition.top,
							left: inputPosition.left,
							zIndex: 1,
							backgroundColor: 'white',
							border: '1px solid black',
						}}
					>
						{suggestedPatterns.map((pattern, index) => (
							<div key={index} onClick={() => handlePatternSuggestionClick(pattern)}>
								{pattern}
							</div>
						))}
					</div>
				</Item>
			</Grid>
			<Grid item xs={4} md={4}>
				<Item><GrokLibrary onPatternUpdate={refreshGrokPatterns} /></Item>
			</Grid>
		</Grid>


	);
}

export default GrokDebugger;