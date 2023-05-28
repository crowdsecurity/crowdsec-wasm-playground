import './App.css';

import React from 'react';

import { Outlet } from 'react-router-dom';

import CircularProgress from '@mui/material/CircularProgress';
import WASMLoader from './components/wasmLoader/wasmLoader';
import ResponsiveAppBar from './components/header/header.tsx';

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
      <div className="App">
        <ResponsiveAppBar/>
        <WASMLoader onLoad={this.handleLoaded} />
        { isLoaded ? <div><Outlet /></div> : <div class="centered"><CircularProgress /><div>Loading Crowdsec Playground</div></div>}
      </div>
    );
  }
}

export default App;
