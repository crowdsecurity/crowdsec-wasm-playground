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
    const loadWasm = async () => {
      try {
        const go = new Go();
        const result = await WebAssembly.instantiateStreaming(
          fetch("main.wasm"),
          go.importObject,
        );
        console.log("Result: ", result);
        go.run(result.instance);
        window.grokInit();
        setIsLoaded(true);
      } catch (error) {
        console.error("Problem loading wasm");
        console.error(error);
      }
    };

    loadWasm();
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
