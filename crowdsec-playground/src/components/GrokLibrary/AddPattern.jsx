import { useState } from "react";
import {
  Dialog,
  Button,
  TextField,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";

const AddPatternComponent = (props) => {
  const [newPatternKey, setNewPatternKey] = useState("");
  const [newPatternValue, setNewPatternValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleInputChange = (event) => {
    switch (event.target.name) {
      case "newPatternKey":
        setNewPatternKey(event.target.value);
        break;
      case "newPatternValue":
        setNewPatternValue(event.target.value);
        break;
      default:
        console.error("Error: unknown input name: ", event.target.name);
    }
  };

  const handleDialog = () => {
    setDialogOpen((prevState) => !prevState);
  };

  const handleSubmit = () => {
    let [ret, errValue] = props.addPattern(newPatternKey, newPatternValue);
    if (ret === false) {
      console.log("Error adding pattern in submit: ", errValue);
      setErrMsg(errValue);
      return;
    }
    handleDialog();
    setErrMsg("");
    setNewPatternKey("");
    setNewPatternValue("");
  };

  return (
    <>
      <Button onClick={handleDialog} variant="contained" color="primary">
        Add Pattern
      </Button>
      <Dialog open={dialogOpen} onClose={handleDialog}>
        <DialogTitle>Add New Pattern</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the key and value for the new pattern.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="newPatternKey"
            value={newPatternKey}
            onChange={handleInputChange}
            label="Pattern Key"
            fullWidth
          />
          <TextField
            margin="dense"
            name="newPatternValue"
            value={newPatternValue}
            onChange={handleInputChange}
            label="Pattern Value"
            fullWidth
          />
          {errMsg && (
            <Alert severity="error">
              An error occurred while adding the pattern: {errMsg}.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddPatternComponent;
