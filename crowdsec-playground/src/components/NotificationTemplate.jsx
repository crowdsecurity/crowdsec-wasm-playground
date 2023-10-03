import { useState } from "react";
import { Button } from "@mui/base";
import { Grid } from "@mui/material";
import Item from "@mui/material/Grid";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";

export default function NotificationTemplate() {
  const [alert, setAlert] = useState("");
  const [template, setTemplate] = useState("");
  const [output, setOutput] = useState("");

  const handleSubmit = () => {
    let ret = window.formatAlert(alert, template);
    if (ret.error !== undefined) {
      setOutput(ret.error);
    } else {
      setOutput(ret.out);
    }
  };

  return (
    <div className="notificationTemplate">
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Item>
            <h1>Alert JSON</h1>
            <CodeMirror
              theme={"dark"}
              value={alert}
              onChange={(value) => setAlert(value)}
              extensions={[json(), EditorView.lineWrapping]}
              basicSetup={{
                foldGutter: true,
              }}
              style={{ textAlign: "left" }}
            />
          </Item>
        </Grid>
        <Grid item xs={6} wrap="nowrap" sx={{ overflow: "auto" }}>
          <Item>
            <h1>Notification Template</h1>
            <CodeMirror
              theme={"dark"}
              value={template}
              onChange={(value) => setTemplate(value)}
              extensions={[EditorView.lineWrapping]}
              style={{ textAlign: "left" }}
            />
          </Item>
          <Grid item xs={12}>
            <Button onClick={handleSubmit}>Apply template</Button>
            <Item>
              <h1>Output</h1>
              <CodeMirror
                theme={"dark"}
                value={output}
                extensions={[
                  EditorView.lineWrapping,
                  EditorView.editable.of(false),
                  EditorState.readOnly.of(true),
                ]}
                style={{ textAlign: "left" }}
              />
            </Item>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
