
import React from 'react';
import { TextareaAutosize } from '@mui/base';
import { styled } from '@mui/system';
import { Grid } from '@mui/material';
import Item from '@mui/material/Grid';


const StyledTextarea = styled(TextareaAutosize)({
	width: '95%',
	borderRadius: '25px',
	maxWidth: '95%',
	minWidth: '95%',
	padding: '12px 24px',
	border: '1px solid #ccc',
	'&:focus': {
	  borderColor: 'black',
	  outline: 'none',
	},
  });

function NotificationTemplate() {


	return (
		<div className="notificationTemplate">
			<Grid container spacing={2}>
				<Grid item xs={6}>
					<Item>
					<h1>Notification Template</h1>
					<StyledTextarea minRows={10} wrap="nowrap" sx={{ overflow: "auto" }}/>
					</Item>
					</Grid>
				<Grid item xs={6} wrap="nowrap" sx={{ overflow: "auto" }}>
					<Item>
					<h1>Notification Template</h1>
					<StyledTextarea minRows={10}/>
					</Item>
				</Grid>
				<Grid item xs={12}>
					<Item>
					<h1>Output</h1>
					<StyledTextarea minRows={10} readOnly/>
					</Item>
				</Grid>
			</Grid>
			

			
		</div>
	);

}

export default NotificationTemplate;