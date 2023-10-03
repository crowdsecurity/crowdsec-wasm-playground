import "./App.css";

import { useState, useEffect } from "react";

import { Outlet } from "react-router-dom";

import CircularProgress from "@mui/material/CircularProgress";
import ResponsiveAppBar from "src/components/Header";
import { createTheme, ThemeProvider, Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#536dfe", // Adjust the primary color
    },
    secondary: {
      main: "#ec407a", // Adjust the secondary color
    },
    background: {
      default: "#1c2331", // Adjust the default background color
      paper: "#263238", // Adjust the background color of paper-like elements
    },
  },
});

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const go = new window.Go();
    fetch("main.wasm")
      .then((response) => response.arrayBuffer())
      .then((bytes) => WebAssembly.instantiate(bytes, go.importObject))
      .then((result) => {
        console.log("Go: ", go);
        console.log("Result: ", result);
        go.run(result.instance);
        window.grokInit();
        setIsLoaded(true);
      });
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <ResponsiveAppBar />
        {isLoaded ? (
          <Outlet />
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress />
            <div>Loading CrowdSec Playground</div>
          </Box>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
