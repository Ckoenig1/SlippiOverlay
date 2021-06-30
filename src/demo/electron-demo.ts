import { app, BrowserWindow,Menu,dialog } from 'electron'
import { overlayWindow } from '../'
import * as fs from 'fs'
import {ConversionType, SlippiGame} from "@ckoenig1/slippi-js"
import * as mv from 'mv'
import * as _ from 'lodash'
import { Client, createClient } from '@urql/core'
import 'isomorphic-unfetch'
import * as path from 'path'
import { statTracker } from './statTracker'
import { Map } from './types/Map'
const prompt = require('electron-prompt');



//app.disableHardwareAcceleration()

let window: BrowserWindow
let client : Client
let Slippipath: string
let tracker: statTracker
let trackerData: statTracker | undefined
let userInfo: {main: number, secondary: number,userCode: string}
export let opponentMap:Map = {}
export let stageMap: number[] = []


fs.readFile("tracker.txt", function(err,data) {
  if (err) {
      console.log(err);
  }
  else{
    trackerData = JSON.parse(data.toString())
  }
});

fs.readFile("UserInfo.txt", function(err,data) {
  if(err) {
    console.log(err)
  }
  else{
    userInfo = JSON.parse(data.toString())
  }
})







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

async function calcStats(){
  console.log("pressed shift E")
  fs.readdir(Slippipath,(err,files)=>{
    if(err) throw err;
    if(!userInfo){
      userInfo = {main: -1,secondary:-1,userCode:""}
    }
    if(!trackerData){
      tracker = new statTracker(null,userInfo)
    }else{
      tracker = new statTracker(trackerData, userInfo)
    }
    var index;
    var file;
    // loop through all files in directory
    for(index in files){
      file = files[index]
      if(file != "old_games"){
        // calc the stats for each game
        console.log("processing: " + Slippipath+"\\"+file)
        const game = new SlippiGame(Slippipath+"\\"+file)
        tracker.addGame(game,opponentMap,stageMap,userInfo)

        // move all files that have been processed into the old_games folder
        mv(Slippipath+"\\"+file,Slippipath+"\\old_games\\"+file,{mkdirp: true},function(err:any){
          if(err) throw err;
        })
      }
    }
    fs.writeFile("tracker.txt", JSON.stringify(tracker), function(err) {
      if (err) {
          console.log(err);
      }
    });

    window.webContents.send('fromMain', tracker)
    trackerData = tracker

    // const mutationLogin = `mutation{
    //   login(options: {username: "chris", password: "chris"}){
    //     errors{
    //       field
    //       message
    //     }
    //     user{
    //       id
    //       username
    //     }
    //   }
    // }`

    // const meQuery = `{
    //   me{
    //     id
    //     username
    //   }
    // }`
    
    // // login and then send updated stats to the server
    // client.mutation(mutationLogin).toPromise().then(async (result) => {
      
    //   window.webContents.session.cookies.get({}).then((cooks) => {
    //     console.log(cooks[0])
    //     client.query(meQuery).toPromise().then(result => console.log(result))
    //   })
      
      
    //   console.log(result)
      // console.log(result); // { data: ... }
      // const fucker = async (i:string) => {
      //   let mainStats = tracker.char1.players[i]
      //   let secStats = tracker.char2.players[i]
      //   let characterMain: number = tracker.char1.character
      //   let characterSec: number = tracker.char2.character
      //   opponentMap[i].forEach(async (stage) => {
      //     if(mainStats?.[stage]){
      //      const matchupMut = `mutation{
      //         updateStats(stats: ${(mainStats[stage]).toString() + ",stageID: " + stage + ",opponentCode: " + "\""+i+"\"" + ",charId: " + characterMain + "}"  }){
      //           losses
      //           totalGames
      //         }
      //       }`;
      //       await client.mutation(matchupMut).toPromise().then(result => console.log(result))
      //     }
      //     if(secStats?.[stage]){
      //       const matchupMut2 = `mutation{
      //         updateStats(stats: ${(secStats[stage]).toString() + ",stageID: " + stage + ",opponentCode: " + "\""+i+"\"" + ",charId: " + characterSec + "}"  }){
      //           losses
      //           totalGames
      //         }
      //       }`;
      //       await client.mutation(matchupMut2).toPromise().then(result => console.log(result))
      //     }
      //   })
      //   // update total for each player
      //   if(i === "SQUI#760"){
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //     console.log(tracker.total.players[i])
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //     console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      //   }
      //   const opTotMut = `mutation{
      //     updateStats(stats: ${(tracker.total.players[i]).toString() + ",stageID: -1" + ",opponentCode: " + "\""+i+"\"" + ",charId: -1" + "}"  }){
      //       losses
      //       totalGames
      //     }
      //   }`;
      //   await client.mutation(opTotMut).toPromise().then(result => console.log(result))

        
      // }
      // // this for loop sends all the opponent matchup stat updates
      // // does not send the total stat updates 
      // var i: string
      // for( i in opponentMap){
      //   fucker(i)
      // }
      // // now send total stat updates
      // stageMap.forEach(async (id) => {
      //   let totStats = tracker.total.stages[id]
      //   let mainStats = tracker.char1.stages[id]
      //   let secStats = tracker.char2.stages[id]
      //   let stageTotMut = `mutation{
      //     updateStats(stats: ${(totStats).toString() + ",stageID: " + id + ",opponentCode: " + "\"total\"" + ",charId: -1 }"  }){
      //       losses
      //       totalGames
      //     }
      //   }`;
      //   let mainStageMut = `mutation{
      //     updateStats(stats: ${(mainStats).toString() + ",stageID: " + id + ",opponentCode: " + "\"total\"" + ",charId: " +tracker.char1.character + "}"  }){
      //       losses
      //       totalGames
      //     }
      //   }`;
      //   let secStageMut = `mutation{
      //     updateStats(stats: ${(secStats).toString() + ",stageID: " + id + ",opponentCode: " + "\"total\"" + ",charId: " +tracker.char2.character + "}"  }){
      //       losses
      //       totalGames
      //     }
      //   }`;
      //   await client.mutation(stageTotMut).toPromise().then(result => console.log(result))
      //   await client.mutation(mainStageMut).toPromise().then(result => console.log(result))
      //   await client.mutation(secStageMut).toPromise().then(result => console.log(result))
      // })
      // const totalMut = `mutation{
      //   updateStats(stats: ${(tracker.total.stats).toString() + ",stageID: -1" + ",opponentCode: " + "\"total\"" + ",charId: -1}"  }){
      //     losses
      //     totalGames
      //   }
      // }`;
      // const char1TotMut = `mutation{
      //   updateStats(stats: ${(tracker.char1.total).toString() + ",stageID: -1"  + ",opponentCode: " + "\"total\"" + ",charId: " +tracker.char1.character + "}"  }){
      //     losses
      //     totalGames
      //   }
      // }`;
      // const char2TotMut = `mutation{
      //   updateStats(stats: ${(tracker.char2.total).toString() + ",stageID: -1" + ",opponentCode: " + "\"total\"" + ",charId: " +tracker.char2.character + "}"  }){
      //     losses
      //     totalGames
      //   }
      // }`;
      // await client.mutation(totalMut).toPromise()
      // await client.mutation(char1TotMut).toPromise()
      // await client.mutation(char2TotMut).toPromise()
      // // wipe the opponentMap so that repeated updates dont update unecessary players
      // console.log(opponentMap)
      // console.log(await window.webContents.session.cookies.get({}))
    // }).catch(err => console.log(err));


  })
}

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
  client = createClient({
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: 'include',
    },
    
  });
  

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
