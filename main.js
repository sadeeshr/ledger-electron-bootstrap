'use strict';

// Import parts of electron to use
const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path')
const url = require('url')

const ledger = require('ledgerco')
const fork = require('child_process').fork


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
var deviceState = false;
var ledgercomm
var eth

// Keep a reference for dev mode
let dev = false;
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true;
}

function createWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 700, height: 600, show: false
  });

  // and load the index.html of the app.
  let indexPath;
  if (dev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL(indexPath);

  /**
   * Fork the ledger module creation as separate process and return the status here.
   */
  var ledgerWorker = fork(`${__dirname}/ledger-worker.js`)
  
  // ledger module device process handler
  ledgerWorker.on('message', (message) => {
    if (message.connected && !ledgercomm) {
      deviceState = true
      console.log("creating comm object")
      ledger.comm_node.create_async().then((comm) => {
        ledgercomm = comm
        console.log("comm: ", comm);
      }).fail((error) => console.log(error))
    } else if (!message.connected && ledgercomm) {
      deviceState = false
      ledgercomm.close_async()
      ledgercomm = null
    }
  })

/**
 * Ledger events handling
 */
  ipcMain.on('ledger', (event, arg) => {
    if (arg.action == 'getStatus') {
      event.sender.send('status', deviceState);
    } else if (arg.action == 'getAddress') {
      let ethBip32 = "44'/60'/0'/";
      eth = new ledger.eth(ledgercomm);
      console.log("ETH: ", eth);
      for (let i = 0; i < 5; i++) {
        eth.getAddress_async(ethBip32 + i)
          .then(
          function (result) {
            result["bip32"] = ethBip32 + i;
            console.log("RESULT : ", result);
            event.sender.send('address', result);
          })
          .catch(
          function (error) {
            console.log("ERROR is: ", error);
          });
      }
    } else if (arg.action == 'getSignedTransaction') {
      console.log("i m here going for signing transaction");      
      var rawHex = "ea808504e3b29200825208944ec785f4a73dd7889681389a6f65769913a30876865af3107a400080018080";
      eth.signTransaction_async(JSON.parse(arg.bip32), rawHex)
      .then(function (result) {
          console.log("result here: ", result);
          event.sender.send('validtransaction', result);
      })
      .fail(function (ex) { console.log(ex); });
    }
  });

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
    if (dev) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
