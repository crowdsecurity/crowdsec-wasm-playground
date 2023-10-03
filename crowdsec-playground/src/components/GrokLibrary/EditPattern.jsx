import React, { useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  Dialog,
  DialogTitle,
  Alert,
  TextField,
} from "@mui/material";

const EditPattern = (props) => {
  const [patternValue, setPatternValue] = useState(props.patternValue);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleInputChange = (event) => {
    setPatternValue(event.target.value);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    let [ret, errValue] = props.editPattern(props.patternKey, patternValue);
    if (ret === false) {
      console.log("Error adding editing in submit: ", errValue);
      setErrMsg(errValue);
      return;
    }
    handleCloseDialog();
    setErrMsg("");
  };

  return (
    <>
      <Button onClick={handleOpenDialog} variant="contained" color="primary">
        Edit Pattern
      </Button>
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Edit Pattern</DialogTitle>
        <DialogContent>
          {props.patternKey}
          <TextField
            margin="dense"
            name="newPatternValue"
            value={patternValue}
            onChange={handleInputChange}
            label="Pattern Value"
            fullWidth
          />
          {errMsg && (
            <Alert severity="error">
              An error occurred while editing the pattern: {errMsg}.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditPattern;
