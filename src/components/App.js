import '../assets/css/App.css';
<<<<<<< HEAD
import React, { Component } from 'react';

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello, Electron!</h1>
        <p>I hope you enjoy using basic-electron-react-boilerplate to start your dev off right!</p>
=======
// import '~/bootstrap/dist/css/boostrap.css'
// import '../../node_modules/bootstrap/dist/css/bootstrap.css'
// import '../assets/css/bootstrap.min.css';
// import "../assets/css/bootstrap-theme.min.css";
import React, { Component } from 'react';
var { ipcRenderer, remote } = require('electron');
import {Panel, Nav, Navbar, Button} from 'react-bootstrap';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      eths: []
    }

    ipcRenderer.on('address', (event, arg) => {
      console.log("Ledger Device ETH Address from main process: ", arg);
      this.setState({eths:[...this.state.eths, arg.address]});
    });
  }
  
  onConnect() {
    ipcRenderer.send('ledger', {
      action: 'getAddress'
    });
  }

  componentDidMount() {
    // Listen for ledger device addresses message from main process

  }


  render() {
    console.log("state: ", this.state);
    return (
      <div>
      <Navbar inverse collapseOnSelect>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="#">Electro-Ledger</a>
        </Navbar.Brand>
      </Navbar.Header>
      
    </Navbar>
    <p>I am electron app, showing ledger eth addresses via REACT !</p>    
    
        <Panel header="ETH addresses" bsStyle="info">
        <Button onClick={this.onConnect.bind(this)}>Connect</Button>
       
        <ul>
        {
          this.state.eths.map((eth,i) => {
            return <li key={i}>{eth}</li>
          })
        }
        </ul>
      </Panel>
        
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
      </div>
    );
  }
}

export default App;
