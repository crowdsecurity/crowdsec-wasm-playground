import React, { useRef } from 'react';

import Button from '@mui/base/Button';
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
import { useEffect, useState } from 'react';
import { Snackbar } from '@mui/material';


import { grokLanguage } from '../../lib/grokLanguage/grokLanguage';

import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';


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

var submatch_group_colors = ['#bc4b51', '#5b8e7d', '#f4a259', '#8cb369']

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
	const [patternValue, setPatternValue] = React.useState('');
	const [inputValue, setInputValue] = React.useState('');


	const loadedGrokPatterns = useRef({});
	const [open, setOpen] = useState(false);
	var evaled = useRef(false);

	const columns = [
		{ title: 'Pattern', field: 'pattern' },
		{ title: 'Value', field: 'value' },
	];

	useEffect(() => {
		// Function to parse URL parameters
		// const clearAnchorData = () => {
		// 	window.history.replaceState({}, document.title, window.location.pathname);
		// };
		const parseAnchorData = () => {
			const anchorData = window.location.hash.slice(1);
			if (!anchorData) {
				return;
			}
			const anchorEncodedData = anchorData.split("?")[1];
			if (anchorEncodedData) {
				const decodedData = decodeURIComponent(anchorEncodedData);
				const parsedData = JSON.parse(decodedData);
				if (parsedData["pattern"] === undefined || parsedData["input"] === undefined) {
					return;
				}
				setPatternValue(parsedData["pattern"]);
				setInputValue(parsedData["input"]);
				//clear extra anchor data
				let prefix = 
				window.location.hash = window.location.hash.split("?")[0]
			}
		};
		parseAnchorData();
	}, []);

	const handleExampleChange = (e) => {
		if (e === null) {
			return
		}
		setGrokExample(e.target.value)
		const examplePattern = GrokPatternExamples[e.target.value]["pattern"];
		const exampleInput = GrokPatternExamples[e.target.value]["input"];
		setPatternValue(examplePattern);
		setInputValue(exampleInput);
	}

	const refreshGrokPatterns = (patterns) => {
		loadedGrokPatterns.current = patterns
		console.log("patterns: ", patterns)
	}

	const HandleShare = () => {
		const pattern = patternValue;
		const input = inputValue;

		//extract the anchor url, and append the data to it
		let prefix = window.location.hash.split("?")[0]
		const anchorData = JSON.stringify({ "pattern": pattern, "input": input });
		window.location.hash = prefix + "?" + encodeURIComponent(anchorData);
		navigator.clipboard.writeText(window.location)
			.then(() => {
				setOpen(true);
			})
			.catch((error) => {
				console.error('Failed to copy data to clipboard:', error);
			});
	}
	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}

		setOpen(false);
	};
	const HandleClick = () => {
		evaled.current = true;
		setError('')
		var ret = window.debugGrok(patternValue, inputValue)

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

			setDataStyles(renderText(start_idx, end_idx, submatch_indexes, inputValue))
			setGrokStyles(renderPattern(idx, patternValue, submatch_indexes))
		}
	}

	const completion = async (context) => {
		let word = context.matchBefore(/%{[^:}]*$/)
		if (word === null || word.from === word.to) {
			return null
		}
		let cleanPattern = word.text.slice(2)
		let matchingPatterns = Object.keys(loadedGrokPatterns.current).filter((pattern) => pattern.startsWith(cleanPattern)).sort().map((pattern) => ({ label: pattern, type: "text" })).slice(0, 10)
		return {
			from: word.from + 2,
			options: matchingPatterns
		}
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
					<TableContainer component={Paper}>
						<Table aria-label="simple table" size="small" width="50%">
							<TableHead>
								<TableRow>
									<TableCell style={{ fontWeight: 'bold' }} align="right">{columns[0].title}</TableCell>
									<TableCell style={{ fontWeight: 'bold' }} align="center">{columns[1].title}</TableCell>

									{/* {columns.map((column) => (<TableCell style={{ fontWeight: 'bold'}} align="center">{column.title}</TableCell>))} */}
								</TableRow>
							</TableHead>
							<TableBody>

								{outputDictValue.filter(
									(key) => {
										return key.value !== "";
									}).map((row) => (<TableRow key={row.idx}>
										<CustomTableCell color={row.color} style={{ color: '#444', fontWeight: 'bold' }} align="right">{row.pattern}</CustomTableCell>
										<CustomTableCell color={row.color} style={{ color: '#444', fontWeight: 'bold' }} align="center">{row.value}</CustomTableCell>
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
			<Grid container style={{ padding: "20px" }} justifyContent="flex-end">
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
						<CodeMirror
							value={patternValue}
							onChange={value => setPatternValue(value)}
							theme="dark"
							extensions={[grokLanguage, EditorView.lineWrapping,
								autocompletion({
									override: [completion],
									activateOnTyping: true
								}),
								EditorState.changeFilter.of((tr) => {
									if (tr.newDoc.sliceString(0).split('\n').length > 1) {
										return false
									}
									return true
								})
							]}
							basicSetup={{ 'autocompletion': true }}
							style={{ textAlign: 'left' }}
						/>
						<div align="left"><h1>Test Data</h1></div>
						<CodeMirror
							value={inputValue}
							onChange={value => setInputValue(value)}
							theme="dark"
							extensions={[EditorView.lineWrapping,
							EditorState.changeFilter.of((tr) => {
								if (tr.newDoc.sliceString(0).split('\n').length > 1) {
									return false
								}
								return true
							})]}
							style={{ textAlign: 'left' }}

						/>
						<div><Button variant="contained" onClick={HandleClick}>Run</Button></div>
						<div><Button variant="contained" onClick={HandleShare}>Share</Button></div>
						<Snackbar
							open={open}
							autoHideDuration={3000}
							onClose={handleClose}
							message="Copied to clipboard"
						/>
						{renderPatternEvaluationResults()}
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