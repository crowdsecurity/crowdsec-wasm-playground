import React, { useRef } from 'react';

import Button from '@mui/base/Button';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Alert } from '@mui/material';
import { styled } from '@mui/system';
import { Grid } from '@mui/material';
import Item from '@mui/material/Grid';
import GrokLibrary from '../grokLibrary/grokLibrary';



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

function GrokDebugger() {

	//const [patternValue, setPatternValue] = React.useState('');
	//const [inputValue, setInputValue] = React.useState('');
	const [outputDictValue, setOutputDictValue] = React.useState('');
	const [matchedValue, setMatchedValue] = React.useState('');
	const [unmatchedValue, setUnmatchedValue] = React.useState('');
	const [error, setError] = React.useState('');

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

		var submatch_indexes = JSON.parse(ret["__submatches_idx"])
		delete ret["__submatches_idx"]

		console.log("idx => ", idx , " type => ", typeof idx)
		console.log("ret => ", ret , " type => ", typeof ret)
		console.log("error => ", error , " type => ", typeof error)
		console.log("start_idx => ", start_idx , " type => ", typeof start_idx)
		console.log("end_idx => ", end_idx , " type => ", typeof end_idx)
		console.log("submatch indexes => ", submatch_indexes , " type => ", typeof submatch_indexes)


		if (ret !== undefined) {
			setOutputDictValue(JSON.stringify(ret, null, 2))
		}
		if (idx == -1) {
			let z = "<font color='green'> full match </font><br>"
			z += "<font color='green'>" + JSON.stringify(ret) + "</font>"
			setOutputDictValue(JSON.stringify(ret, null, 2))
			setMatchedValue(inputValue.current)
		} else {

			setMatchedValue(inputValue.current.substring(0, idx))
			setUnmatchedValue(inputValue.current.substring(idx))
			/*let z = "match until index " + idx + "<br>"
			z += "(green part of regexp matches) <font color=\"green\">" + patternValue.current.slice(0, idx) + "</font>"
			z += "<font color=\"red\">" + patternValue.current.slice(idx) + "</font><br>"
			
			z += "(green part of input matched) "
			for (let i = 0; i < inputValue.current.length; i++) {
				let bold = false
				console.log("sumatch indexes => ", ret["__submatches_idx"])
				for (let j = 0; j < submatch_indexes.length; j++) {
					if (i >= submatch_indexes[j][0] && i < submatch_indexes[j][1]) {
						bold = true
						console.log("index %d is in [%d,%d]", i, submatch_indexes[j][0], submatch_indexes[j][1])
						z += "<b>"
						break
					}
				}

				if (i >= start_idx && i < end_idx) {
					z += "<font color=\"green\">" + inputValue.current[i] + "</font>"
				} else if (i > end_idx) {
					z += "<font color=\"red\">" + inputValue.current[i] + "</font>"
				} 
				if (bold == true) {
					z += "</b>"
				}
			}
			z += "<br>"

			// z += "(green part of input matched) <font color=\"green\">" + input.substring(start_idx, end_idx) + "</font>"
			// z += "<font color=\"red\">" + input.substring(end_idx) + "</font><br>"

			z += "Last match : <br>" + JSON.stringify(ret) + "<br>"*/
			//setOutputDictValue(ret)
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