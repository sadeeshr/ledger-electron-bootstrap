import '../assets/css/App.css';
import React, { Component } from 'react';
var { ipcRenderer, remote } = require('electron');
import { Panel, Nav, Navbar, Button } from 'react-bootstrap';

import Ledger from './ledger';

class App extends React.Component {

  render() {
    return (
      <div>
        <Navbar inverse collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#">Electro-Ledger</a>
            </Navbar.Brand>
          </Navbar.Header>

        </Navbar>
        <Panel header="Ethereum Wallet" bsStyle="info">
          <Ledger />
        </Panel>
      </div>
    );
  }
}

export default App;
