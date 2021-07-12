import { SlippiGame } from "@ckoenig1/slippi-js"
import mv = require("mv")
import { statTracker } from "./statTracker"
import { Map } from './types/Map'
import * as fs from 'fs'
const electron = require('electron')
const ipcRenderer = electron.ipcRenderer



let Slippipath: string
let tracker: statTracker
let trackerData: statTracker | undefined
let userInfo: {main: number, secondary: number,userCode: string}
export let opponentMap: Map = {}
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
  
      ipcRenderer.send("finished calc",tracker)
      trackerData = tracker
  
  
  
    })
  }
  ipcRenderer.on("Begin Calc",(event,arg)=> {
      calcStats()
  })