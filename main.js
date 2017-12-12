'use strict';

// Import parts of electron to use
<<<<<<< HEAD
const {app, BrowserWindow} = require('electron');
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep a reference for dev mode
let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
=======
const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path')
const url = require('url')

const ledger = require('ledgerco')
const fork = require('child_process').fork


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
var ledgercomm
var eth

// Keep a reference for dev mode
let dev = false;
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
  dev = true;
}

function createWindow() {
<<<<<<< HEAD
=======

  // setTimeout(() => {
  //   console.log("L: ",ledger);
  //   ledger.comm_node.list_async().then((deviceList) => {
  //     console.log("D: ",deviceList.length);
  //     if(deviceList.length > 0)
  //           console.log("Connected: ", deviceList);
  //     ledger.comm_node.create_async().then((comm) => {
  //       console.log("C: ",comm)
  //       ledgercomm = comm
  //       console.log("LedgerComm: ", ledgercomm);
  //       eth = new ledger.eth(ledgercomm);
  //       console.log("ETH: ", eth);
  //       let ethBip32 = "44'/60'/0'/";

  //       for (let i = 0; i < 5; i++) {
  //         eth.getAddress_async(ethBip32 + 0)
  //           .then(
  //           function (result) {
  //             console.log("RESULT : ", result);
  //             // event.sender.send('address', result);
  //           })
  //           .catch(
  //           function (error) {
  //             console.log("ERROR is: ", error);
  //           });
  //       }
  //     }).fail((error) => console.log(error))
  //   })
  // }, 5000);

>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024, height: 768, show: false
  });

  // and load the index.html of the app.
  let indexPath;
<<<<<<< HEAD
  if ( dev && process.argv.indexOf('--noDevServer') === -1 ) {
=======
  if (dev && process.argv.indexOf('--noDevServer') === -1) {
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
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
<<<<<<< HEAD
  mainWindow.loadURL( indexPath );
=======
  mainWindow.loadURL(indexPath);

  var ledgerWorker = fork(`${__dirname}/ledger-worker.js`)

  ledgerWorker.on('message', (message) => {
    if (message.connected && !ledgercomm) {
      console.log("creating comm object")
      ledger.comm_node.create_async().then((comm) => {
        ledgercomm = comm
        console.log("comm: ", comm);
      }).fail((error) => console.log(error))
    } else if (!message.connected && ledgercomm) {
      ledgercomm.close_async()
      ledgercomm = null
    }
  })



  ipcMain.on('ledger', (event, arg) => {
    if (arg.action == 'getAddress') {
      let ethBip32 = "44'/60'/0'/";
      eth = new ledger.eth(ledgercomm);
            console.log("ETH: ", eth);
      for (let i = 0; i < 5; i++) {
        eth.getAddress_async(ethBip32 + i)
          .then(
          function (result) {
            console.log("RESULT : ", result);
            event.sender.send('address', result);
          })
          .catch(
          function (error) {
            console.log("ERROR is: ", error);
          });
      }
    }
  });
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
<<<<<<< HEAD
    if ( dev ) {
=======
    if (dev) {
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
<<<<<<< HEAD
  mainWindow.on('closed', function() {
=======
  mainWindow.on('closed', function () {
>>>>>>> 248a8748d677376e2027b06121e28687a33c38de
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
