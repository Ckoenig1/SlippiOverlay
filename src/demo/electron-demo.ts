import { app, BrowserWindow,Menu,dialog, ipcMain } from 'electron'
import { overlayWindow } from '../'
import * as fs from 'fs'
import * as _ from 'lodash'
import 'isomorphic-unfetch'
import * as path from 'path'
import { Map } from './types/Map'
const prompt = require('electron-prompt');



//app.disableHardwareAcceleration()

let window: BrowserWindow
let workerWindow : BrowserWindow
let Slippipath: string
let userInfo: {main: number, secondary: number,userCode: string}
export let opponentMap:Map = {}
export let stageMap: number[] = []







const isMac = process.platform === 'darwin'
async function getFile(){
  const charArray = ["Mario","Fox","Falcon","Donkey Kong", "Kirby","Bowser", "Link", "Shiek", "Ness", "Peach", "Popo", "Nana", "Pikachu", "Samus","Yoshi","Jigglypuff", "Mewtwo", "Luigi", "Marth","Zelda","Young Link","Dr.Mario", "Falco", "Pichu", "G & W", "Ganondorf", "Roy"]
  
  const files = await dialog.showOpenDialog(window,{properties:['openDirectory']})
 
  

  let userCode = await prompt({
    title: 'User Code',
    label: 'Enter User Code:',
    value: '????#123',
    inputAttrs: {
        type: 'text'
    },
    type: 'input'
  },window)
  

  let indexMain = await prompt({
    title: 'Pick Main',
    label: 'Which character is your main?',
    type: 'select',
    selectOptions: charArray
  },window)
 

  let indexSec = await prompt({
    title: 'Pick Secondary',
    label: 'Which character is your secondary?',
    type: 'select',
    selectOptions: charArray
  },window)
  
  userInfo = {main: indexMain, secondary: indexSec, userCode: userCode }
  const file = files.filePaths[0]
  fs.writeFile('Slippipath.txt', file,'utf-8', (err) => {
    if (err) throw err;
    console.log('slippi path has been saved!');
  });
  fs.writeFile('UserInfo.txt', JSON.stringify(userInfo), (err) => {
    if (err) throw err;
    console.log('user info has been saved');
  });
}


  function calcStats(){
    console.log("beginning")
    workerWindow.webContents.send("Begin Calc",Slippipath)
  }
// async function calcStats(){
//   console.log("pressed shift E")
//   fs.readdir(Slippipath,(err,files)=>{
//     if(err) throw err;
//     if(!userInfo){
//       userInfo = {main: -1,secondary:-1,userCode:""}
//     }
//     if(!trackerData){
//       tracker = new statTracker(null,userInfo)
//     }else{
//       tracker = new statTracker(trackerData, userInfo)
//     }
//     var index;
//     var file;
//     // loop through all files in directory
//     for(index in files){
//       file = files[index]
//       if(file != "old_games"){
//         // calc the stats for each game
//         console.log("processing: " + Slippipath+"\\"+file)
//         const game = new SlippiGame(Slippipath+"\\"+file)
//         tracker.addGame(game,opponentMap,stageMap,userInfo)

//         // move all files that have been processed into the old_games folder
//         mv(Slippipath+"\\"+file,Slippipath+"\\old_games\\"+file,{mkdirp: true},function(err:any){
//           if(err) throw err;
//         })
//       }
//     }
//     fs.writeFile("tracker.txt", JSON.stringify(tracker), function(err) {
//       if (err) {
//           console.log(err);
//       }
//     });

//     window.webContents.send('fromMain', tracker)
//     trackerData = tracker



//   })
// }

function createWindow () {
  window = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences:{
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname,'preload.js')
    },
    ...overlayWindow.WINDOW_OPTS
  }
  )

  window.loadURL('http://localhost:3000/')
  //window.webContents.openDevTools()
  // client = createClient({
  //   url: 'http://localhost:4000/graphql',
  //   fetchOptions: {
  //     credentials: 'include',
  //   },
    
  // });


  workerWindow = new BrowserWindow({
    show: false,
    webPreferences:{
      nodeIntegration: true, // is default value after Electron v5
      contextIsolation: false,
    },
  }
  )
  workerWindow.loadFile("worker.html")
  

  const template:Electron.MenuItemConstructorOptions[] = [
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    },
    {
      label: 'Slippi Settings',
      submenu: [
        {
          label: 'Set replay location',
          accelerator: 'CmdOrCtrl+O',
          click(){
            getFile();
          },
        },
        {
          label: 'Calc stats',
          accelerator: 'Shift+E',
          click(){
            calcStats();
          },
        }
      ]
    },
  ];
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

 // window.setIgnoreMouseEvents(true)
  window.focus()

  overlayWindow.attachTo(window, 'Dolphin')
}

app.on('ready', () => {
  setTimeout(
    createWindow,
    process.platform === 'linux' ? 1000 : 0
  )
  ipcMain.on('finished calc', (event, arg) =>{
    console.log(arg)
    window.webContents.send('fromMain', arg)
  })
  try{
    fs.readFile('Slippipath.txt', 'utf-8',(err, data) => {
    if (err) throw err;
    console.log(data);
    Slippipath = data
  });
  }
  catch(err){
    Slippipath = ""
  }
  
  
})
