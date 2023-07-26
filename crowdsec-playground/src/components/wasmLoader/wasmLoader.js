import React from "react";

class WASMLoader extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
		  isLoaded: false,
		};
	  }
	
	  async componentDidMount() {
		const go = new window.Go();
		fetch("main.wasm").then(response =>
		  response.arrayBuffer()
		).then(bytes =>
		  WebAssembly.instantiate(bytes, go.importObject)
		).then(result => {
		  console.log("Go: ", go);
		  console.log("Result: ", result);
		  go.run(result.instance);
		  window.grokInit()
		  this.props.onLoad();
		});
	  }

	  render() {
		return (
			<div>
			</div>
		);
	  }
}

export default WASMLoader;