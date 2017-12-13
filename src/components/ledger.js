import React, { Component } from 'react'
import { Alert, FormControl, Form, Col, Panel, Modal, Button, Tooltip, OverlayTrigger, Table, ProgressBar, FormGroup, ControlLabel, Label } from 'react-bootstrap';
// import ledger from 'ledgerco';
import BigNumber from 'bignumber.js';
import Tx from 'ethereumjs-tx';
import RLP from 'rlp';
var { ipcRenderer, remote } = require('electron');


class Ledger extends Component {

    constructor(props) {
        super(props);
        this.apikey = "HEX6ZJP9JPRTD8K5XCR4YGREDM184MGEUM";
        this.state = {
            comm: null,
            connected: false,
            showAccounts: false,
            showGenRawTr: false,
            showGenSignTr: false,
            fetchEthComplete: true,
            showSignTx: false,
            showFinalResponse: false,
            transactionResponse: null,
            progress: 50,
            progressText: "Fetching Accounts From Device.",
            modalShow: false,
            alert: false,
            eths: [],
            ethtx: [],
            web3Accounts: null,
            rawTx: null,
            rawHex: null,
            signedTx: null,
            signedHex: null,
            toAcc: "",
            value: "",
            gasLimit: "21000",
            gasPrice: "21000000000",
            nonce: "",
            chainId: ""
        };



        ipcRenderer.on('status', (event, arg) => {
            console.log("Ledger Device Status from main process: ", arg);
            this.setState({ connected: arg });
        });

        ipcRenderer.on('address', (event, arg) => {
            console.log("Ledger Device ETH Address from main process: ", arg);
            this.handleAddress(arg);
        });

        ipcRenderer.on('validtransaction', (event, arg) => {
            console.log("Ledger Device Validated Offline Transaction from main process: ", arg);
            this.handleSignedTransaction(arg);
        });


    }


    componentWillMount() {
        setInterval(() => {
            ipcRenderer.send('ledger', {
                action: 'getStatus'
            });
        }, 2000);
    }

    getAddress() {
        this.setState({ eths: [], ethtx: [], fetchEthComplete: false });
        ipcRenderer.send('ledger', {
            action: 'getAddress'
        });
    }

    handleAddress(result) {

        let that = this;
        // console.log(this.state.eth);
        this.setState({ eths: [], fetchEthComplete: false });
        console.log("LIST OF ETHEREUM ADDRESSES: ");
        console.log("=============================");

        that.setState({
            alert: false,
            alertTitle: null,
            alertMessage: null,
            progress: 80,
            progressText: "Fetching Balance"
        });
        console.log(". BIP32: ", result.bip32 + "  Address: " + result.address);
        that.getBalance(result.address);
        that.getTransactionCount(result.bip32, result.address);
    }

    handleSignedTransaction(result) {
        var rawTx = that.state.rawTx;
        rawTx.v = "0x" + result["v"];
        rawTx.r = "0x" + result['r'];
        rawTx.s = "0x" + result['s'];
        var signedTx = new Tx(rawTx);
        console.log("Signed Transaction: ", signedTx);
        if (signedTx.verifySignature()) {
            console.log('Signature Checks out!')
        }
        var signedHex = RLP.encode(signedTx.raw).toString('hex')
        console.log("Signed Trx Hex: ", "0x" + signedHex);
        that.setState({ signedTx: signedTx, signedHex: "0x" + signedHex, showSignTx: true });
    }

    toHex(dec) {
        return ("0x" + new BigNumber(dec).toString(16));
    }

    toDecimal(hex) {
        return (new BigNumber(hex).toString());
    }

    toEther(number) {
        var ethValue = new BigNumber(number, 10).mul(1).round(0, BigNumber.ROUND_DOWN).div(1000000000000000000).toString(10);
        return ethValue.toString(10);
    };

    toWei(number) {
        var weiValue = new BigNumber(number).mul(1000000000000000000).round(0, BigNumber.ROUND_DOWN);
        console.log("wei value: ", weiValue.toString(10));
        return weiValue.toString(10);
    };


    getBalance(address) {

        let url = "https://api.etherscan.io/api?module=account&action=balance&address=" + address + "&tag=latest&apikey=" + this.apikey;
        let that = this;
        fetch(url)
            .then(result => result.json())
            .then(balance => {
                that.state.eths.push({
                    addr: address,
                    bal: this.toEther(balance.result)
                });

                console.log(that.state.eths.length)
                that.setState({ address: true, fetchEthComplete: true });
            })
    }

    getTransactionCount(bip32, address) {

        let url = "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=" + address + "&tag=latest&apikey=" + this.apikey;
        let that = this;
        fetch(url)
            .then(result => result.json())
            .then(txcount => {
                // console.log("count: ", txcount);
                that.state.ethtx.push({
                    addr: address,
                    BIP32: bip32,
                    nonce: txcount.result,
                    chainId: txcount.id
                });
            })
    }

    onFromSelected(e) {
        console.log(e.target.value);
        this.setState({ fromId: e.target.value });
    }

    genRawTransaction() {

        var weiValue = this.toWei(this.state.value);
        console.log(weiValue);

        var account = this.state.ethtx[this.state.fromId];
        var rawTx = {
            to: this.state.toAcc,
            value: this.toHex(weiValue),
            gasLimit: this.toHex(this.state.gasLimit),
            gasPrice: this.toHex(this.state.gasPrice),
            nonce: account.nonce,
            chainId: account.chainId
        };

        // ea808504e3b29200825208944ec785f4a73dd7889681389a6f65769913a30876865af3107a400080018080 
        // ea808504e3b29200825208944ec785f4a73dd7889681389a6f65769913a30876865af3107a4000801c8080

        console.log("Raw Trx: ", rawTx);
        this.setState({ rawTx: rawTx });

        this.setState({ showGenSignTr: !this.state.showGenSignTr });

        var tx = new Tx(rawTx);
        tx.raw[6] = Buffer.from([account.chainId]);
        tx.raw[7] = tx.raw[8] = 0;
        tx.raw.slice(0, 6);
        console.log("Raw Tr Gen: ", tx.raw);

        var encTx = RLP.encode(tx.raw).toString('hex')
        console.log("Raw Trx Hex: ", encTx);
        this.setState({ rawHex: encTx });
    }

    genSignedTransaction() {

        var account = this.state.ethtx[this.state.fromId];
        console.log("Account: ", account);
        console.log("state: ", this.state);
        var that = this;
        this.setState({ modalShow: true });

        ipcRenderer.send('ledger', {
            action: 'getSignedTransaction',
            bip32: JSON.stringify(account.BIP32),
            rawhex: JSON.stringify(this.state.rawHex)

        } );
        // var rawHex = "ea808504e3b29200825208944ec785f4a73dd7889681389a6f65769913a30876865af3107a400080018080";

    }

    pushSignedTransaction() {
        let url = "https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=" + this.state.signedHex + "&apikey=" + this.apikey;
        let that = this;
        fetch(url)
            .then(result => result.json())
            .then(response => {
                console.log(response);
                that.setState({ transactionResponse: response, showFinalResponse: true });
            })

        // fetch(url, {
        //     method: "post",
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //     },

        //     //make sure to serialize your JSON body
        //     body: JSON.stringify({
        //         module: "proxy",
        //         action: "eth_sendRawTransaction",
        //         hex: that.state.signedHex,
        //         apikey: that.apikey
        //     })
        // })
        //     .then((response) => {
        //         console.log(response);
        //         that.setState({ transactionResponse: response, showFinalResponse: true });
        //     });
    }

    hideAlert() {
        this.setState({ alert: false });
    }

    showAlert() {
        this.setState({ alert: true });
    }

    toggleAccounts() {
        this.setState({ showAccounts: !this.state.showAccounts });
    }

    toggleOfflineTx() {
        this.setState({ showGenRawTr: !this.state.showGenRawTr });
    }

    modalClose() {
        this.setState({ modalShow: !this.state.modalShow });
    }

    render() {
        let buttonTitle = "Searching for Device ...";
        let buttonStyle = "warning";
        let subtitle = "Make sure your 'Ledger Nano S' is connected and unlocked with passcode."
        if (this.state.connected) {
            buttonTitle = "Connected";
            buttonStyle = "success";
            subtitle = ""
        }

        const tooltip = (
            <Tooltip id="showEthAcc"><strong>Click to See Your Accounts</strong></Tooltip>
        );

        return (
            <div>
                <Alert bsStyle={buttonStyle}>
                    <strong>{buttonTitle}</strong> {subtitle}
                </Alert>

                <div hidden={!this.state.connected}>
                    <p />
                    <Button bsStyle="primary" block onClick={this.getAddress.bind(this)}>
                        Get Ethereum Addresses
                    </Button>
                </div>
                <div hidden={!this.state.alert}>
                    <p /><p />
                    <Alert bsStyle="danger" onDismiss={this.hideAlert.bind(this)}>
                        <h4>{this.state.alertTitle}</h4>
                        <p>{this.state.alertMessage}</p>
                    </Alert>
                </div>
                <div hidden={this.state.fetchEthComplete}>
                    <p />
                    <ProgressBar bsStyle="info" active now={this.state.progress} label={`${this.state.progressText} ::: ${this.state.progress}%`} />
                </div>
                <p />
                <div hidden={!this.state.address}>
                    <OverlayTrigger placement="bottom" overlay={tooltip}>
                        <Panel header="Ethereum Accounts" bsStyle="warning" collapsible expanded={this.state.showAccounts} onClick={this.toggleAccounts.bind(this)}>
                            <p />
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Address</th>
                                        <th>Balance (eth)</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    {
                                        this.state.eths.map((eth, i) => {
                                            return <tr key={i}><td>{eth.addr}</td><td>{eth.bal}</td></tr>
                                        })
                                    }

                                </tbody>
                            </Table>

                        </Panel>
                    </OverlayTrigger>
                    <Panel header="Generate Offline Transaction" bsStyle="warning" collapsible expanded={true}>
                        <Form horizontal>
                            <FormGroup controlId="fromAddress">
                                <Col componentClass={ControlLabel} md={4}>From Address: </Col>
                                <Col md={6}>
                                    <FormControl componentClass="select" placeholder="Select" onChange={this.onFromSelected.bind(this)}>
                                        <option>========== Select From Address ==========</option>
                                        {
                                            this.state.ethtx.map((eth, i) => {
                                                return <option value={i} key={i}>{eth.addr}</option>
                                            })
                                        }
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} md={4}>To Address: </Col>
                                <Col md={6}><FormControl type="text" value={this.state.toAcc} placeholder="To Address" onChange={(e) => { this.setState({ toAcc: e.target.value }) }} /></Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} md={4}>Value: </Col>
                                <Col md={6}><FormControl type="text" value={this.state.value} placeholder="Value in ETH, eg. 0.001" onChange={(e) => { this.setState({ value: e.target.value }) }} /></Col>
                            </FormGroup>
                            <FormGroup hidden={true}>
                                <Col componentClass={ControlLabel} md={4}>Gas Limit: </Col>
                                <Col md={6}><FormControl type="text" value={this.state.gasLimit} placeholder="21000" onChange={(e) => { this.setState({ gasLimit: e.target.value }) }} /></Col>
                            </FormGroup>
                            <FormGroup hidden={true}>
                                <Col componentClass={ControlLabel} md={4}>Gas Price: </Col>
                                <Col md={6}><FormControl type="text" value={this.state.gasPrice} placeholder="Value in WEI, eg. 21000000000" onChange={(e) => { this.setState({ gasPrice: e.target.value }) }} /></Col>
                            </FormGroup>
                            <Button bsStyle="primary" onClick={this.genRawTransaction.bind(this)}>
                                Generate Offline Transaction 
                    </Button><Label bsStyle="success">{this.state.showGenSignTr ? "Generated Offline Transaction" : ""}</Label>
                        </Form>
                    </Panel>

                </div>
                <div hidden={!this.state.showGenSignTr}>
                    <Panel header="Generate Signed Transaction" onClick={this.genSignedTransaction.bind(this)} bsStyle="warning" collapsible expanded={true}>
                    </Panel>
                </div>
                <Modal bsSize="large" show={this.state.modalShow} backdrop="static">
                    <Modal.Header>
                        <Modal.Title>Transaction Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert bsStyle="warning">
                            <h4>Confirm Your Transaction on Device</h4>
                            <p>Please Check your <strong>Ledger Nano S</strong> Device, to confirm the Transaction.</p>
                        </Alert>
                        <Panel bsStyle="info" header="Raw Transaction" collapsible expanded={true}>
                            <pre>{JSON.stringify(this.state.rawTx, null, 2)}</pre>
                        </Panel>
                        <Panel bsStyle="info" header="Offline Generated Raw Transaction" collapsible expanded={true}>
                            <pre>{JSON.stringify("0x" + this.state.rawHex, null, 2)}</pre>
                        </Panel>
                        <div hidden={!this.state.showSignTx}>
                            <Panel bsStyle="info" header="Final Signed Approved Transaction" collapsible expanded={true}>
                                <pre>{JSON.stringify(this.state.signedHex, null, 2)}</pre>
                            </Panel>
                            <Button disabled={!this.state.showSignTx} bsStyle="primary" onClick={this.pushSignedTransaction.bind(this)}>Send Transaction</Button>
                        </div>
                        <div hidden={!this.state.showFinalResponse}>
                            <Panel bsStyle="info" header="Transaction Response" collapsible expanded={true}>
                                <pre>{JSON.stringify(this.state.transactionResponse, null, 2)}</pre>
                            </Panel>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button bsStyle="danger" onClick={this.modalClose.bind(this)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export default Ledger
