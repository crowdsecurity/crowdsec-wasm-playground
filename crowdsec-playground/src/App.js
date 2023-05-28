import { Component } from 'react';
import './App.css';

import GrokDebugger from './components/grokDebugger/grokDebugger.js';
import GrokLibrary from './components/grokLibrary/grokLibrary';
import CircularProgress from '@mui/material/CircularProgress';
import ResponsiveAppBar from './components/header/header.tsx';
import { Grid } from '@mui/material';
import Item from '@mui/material/Grid';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
  }

  async componentDidMount() {
    const go = new window.Go();
    //const res = await WebAssembly.instantiateStreaming(fetch("main.wasm"), go.importObject);
    fetch("main.wasm").then(response =>
      response.arrayBuffer()
    ).then(bytes =>
      WebAssembly.instantiate(bytes, go.importObject)
    ).then(result => {
      console.log("Go: ", go);
      console.log("Result: ", result);
      go.run(result.instance);
      window.grokInit().then(() => {
        console.log("Grok Init Done");
        this.setState({ isLoaded: true });
      });
      window.patternsLoaded = false;
    });
  }

  render() {
    const { isLoaded } = this.state;
    //console.log(window)
    //console.log(window.test())
    return (
      <div className="App">
        <div><ResponsiveAppBar/></div>
        {!isLoaded ? <div class="centered"><CircularProgress /><div>Loading Grok Debugger</div></div> :
        <GrokDebugger/>
        }
      </div>
    );
  }
}

export default App;
