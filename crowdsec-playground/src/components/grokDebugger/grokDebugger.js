import React, { useRef } from 'react';

import Button from '@mui/base/Button';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Alert } from '@mui/material';
import { styled } from '@mui/system';
import { Grid } from '@mui/material';
import Item from '@mui/material/Grid';
import GrokLibrary from '../grokLibrary/grokLibrary';
import RichTextDisplay from '../richTextDisplay/richtextdisplay';


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

/*
console.log("idx => ", idx , " type => ", typeof idx)
		console.log("ret => ", ret , " type => ", typeof ret)
		console.log("error => ", error , " type => ", typeof error)
		console.log("start_idx => ", start_idx , " type => ", typeof start_idx)
		console.log("end_idx => ", end_idx , " type => ", typeof end_idx)
		console.log("submatch indexes => ", submatch_indexes , " type => ", typeof submatch_indexes)

*/

var submatch_group_colors = ['yellow', 'blue', 'green', 'orange']

function renderPattern(end_idx, pattern) {
	let patternStyles = []
	let insubmatch = false
	let submatch_idx = 0

	//-1 means full match
	if (end_idx == -1) {
		console.log("full match!")
		end_idx = pattern.length
	}

	renderchar:
	for (let i = 0; i < pattern.length; i++) {
		//console.log("char[%d] = %s", i, pattern[i])
		if (i > end_idx) {
			//console.log("after pattern")
			patternStyles.push(
				{ text: pattern[i], style: { color: 'red', fontWeight: 'bold'} }
			)
			continue renderchar
		}

		//console.log("substring => %s", pattern.substring(i-2, i))
		//identify if we're in or out of a submatch
		if (pattern[i] == "%" && pattern[i+1] == "{") {
			//console.log("entering submatch %d", submatch_idx)
			insubmatch = true
		}

		if (insubmatch ==  true && pattern[i-1] == "}" && pattern[i-2] != "\\") {
			insubmatch = false
			//console.log("leaving submatch %d", submatch_idx)
			submatch_idx++
		}

		if (insubmatch == true) {
			//console.log("in submatch %d", submatch_idx)
			patternStyles.push(
				{ text: pattern[i], style: { color: 'green', fontWeight: 'bold', backgroundColor: submatch_group_colors[submatch_idx]} }
			)
			continue renderchar
		}

		//we're not in a submatch, but we're matched
		//console.log("in match")
		patternStyles.push(
			{ text: pattern[i], style: { color: 'green', fontWeight: 'bold'} }
		)
	}
	return patternStyles
}

//render the text with the correct color
function renderText(start_idx, end_idx, submatch_idx, text) {
	let dataStyles = []
	renderchar:
	for (let i = 0; i < text.length; i++) {
		//The char isn't matched
		if (i < start_idx || i >= end_idx) {
			dataStyles.push(
				{ text: text[i], style: { color: 'red', fontWeight: 'bold'} }
			)
			continue renderchar
		}
		//Is the char part of a submatch ?
		let submatch = false
		for (let j = 0; j < submatch_idx.length; j++) {
			if (i >= submatch_idx[j][0] && i < submatch_idx[j][1]) {
				dataStyles.push(
					{ text: text[i], style: { color: 'green', fontWeight: 'bold', backgroundColor: submatch_group_colors[j] } }
				)
				continue renderchar
			}
		}
		//The char is matched, but not part of a submatch
		dataStyles.push(
			{ text: text[i], style: { color: 'green', fontWeight: 'bold'} }
		)
		
	}
	return dataStyles
}

function GrokDebugger() {

	//const [patternValue, setPatternValue] = React.useState('');
	//const [inputValue, setInputValue] = React.useState('');
	const [outputDictValue, setOutputDictValue] = React.useState('');
	const [matchedValue, setMatchedValue] = React.useState('');
	const [unmatchedValue, setUnmatchedValue] = React.useState('');
	const [error, setError] = React.useState('');
	const [grokStyles, setGrokStyles] = React.useState([]);
	const [dataStyles, setDataStyles] = React.useState([]);

	const patternValue = useRef("");
	const inputValue = useRef("");

	const handlePatternChange = (e) => {
		patternValue.current = e.target.value;
	}

	const handleInputChange = (e) => {
		inputValue.current = e.target.value;
	}

	const HandleClick = () => {
		setError('')
		var ret = window.debugGrok(patternValue.current, inputValue.current)

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

		console.log("idx => ", idx , " type => ", typeof idx)
		console.log("ret => ", ret , " type => ", typeof ret)
		console.log("error => ", error , " type => ", typeof error)
		console.log("start_idx => ", start_idx , " type => ", typeof start_idx)
		console.log("end_idx => ", end_idx , " type => ", typeof end_idx)
		console.log("submatch indexes => ", submatch_indexes , " type => ", typeof submatch_indexes)

		if (idx != undefined) {
		if (ret !== undefined) {
		 	setOutputDictValue(JSON.stringify(ret, null, 2))
		 }

		setDataStyles( renderText(start_idx, end_idx, submatch_indexes, inputValue.current) )
		setGrokStyles( renderPattern(idx, patternValue.current) )
		}
	}

	return (
		<Grid container spacing={2}>
		<Grid item xs={8} md={8}>
		  <Item>
		  <div>
		{error && <Alert severity="error">An error occured while processing data: {error}.</Alert>}
		<div align="left"><h1>Pattern</h1></div>
		<StyledTextarea
  			minRows={1}
			className="fixed-textarea"
  			placeholder="Grok Pattern"
			onChange={handlePatternChange}
		/>
		<div align="left"><h1>Test Data</h1></div>
		<StyledTextarea
 		minRows={3}
		className='fixed-textarea'
  		placeholder="Input"
		onChange={handleInputChange}
		/>
		<div><Button variant="contained" onClick={HandleClick}>Run</Button></div>
		<h1>Output</h1>
		<div>{outputDictValue}</div>
		<div className='matched'>{matchedValue}</div>
		<div className='unmatched'>{unmatchedValue}</div>
		<h2> Grok Pattern results </h2>
		<div className='grokResult'><RichTextDisplay styles={grokStyles}/></div>
		<h2> Match data results </h2>
		<div className='dataResult'><RichTextDisplay styles={dataStyles}/></div>
		</div>
		  </Item>
		</Grid>
		<Grid item xs={4} md={4}>
		  <Item><GrokLibrary/></Item>
		</Grid>
	</Grid>

		
	);
}

export default GrokDebugger;