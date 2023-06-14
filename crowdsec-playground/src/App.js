import './App.css';

import React from 'react';

import { Outlet } from 'react-router-dom';

import CircularProgress from '@mui/material/CircularProgress';
import WASMLoader from './components/wasmLoader/wasmLoader';
import ResponsiveAppBar from './components/header/header.tsx';
import { createTheme, ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#536dfe', // Adjust the primary color
    },
    secondary: {
      main: '#ec407a', // Adjust the secondary color
    },
    background: {
      default: '#1c2331', // Adjust the default background color
      paper: '#263238', // Adjust the background color of paper-like elements
    },
  },
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
  }

  handleLoaded = () => {
    this.setState({ isLoaded: true });
  }

  render() {
    const { isLoaded } = this.state;
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
      <div className="App">
        <ResponsiveAppBar/>
        <WASMLoader onLoad={this.handleLoaded} />
        { isLoaded ? <div><Outlet /></div> : <div class="centered"><CircularProgress /><div>Loading Crowdsec Playground</div></div>}
      </div>
      </ThemeProvider>
    );
  }
}

export default App;
