import { SlippiGame } from "@ckoenig1/slippi-js";
import { CumulativeStats } from './types/CumulativeStats';
import {Map} from './types/Map';
import { gameStat } from './gameStat';

type userInfo = {
  main: number,
  secondary: number,
  userCode: string
}


// 32 characters in the game
export class statTracker implements CumulativeStats {
  mostRecent: any;
  total: { userCode: string ,stats: gameStat; stages: gameStat[]; players: { [player: string]: gameStat; }; };
  char1: CumulativeStats["char1"];
  char2: CumulativeStats["char2"];

  constructor(track: statTracker | null, userInfo: userInfo) {
    this.total = {
      userCode: userInfo.userCode,
      stats: new gameStat(null,userInfo),
      stages: Array(35),
      players: {}
    };
    this.char1 = {
      character: userInfo.main,
      total: new gameStat(null,userInfo),
      stages: Array(35),
      players: {}
    };
    this.char2 = {
      character: userInfo.secondary,
      total: new gameStat(null,userInfo),
      stages: Array(35),
      players: {}
    };
    if (track !== null) {
      // this is responsible for recreating the tracker object from a previously saved instance since javascript
      // doesnt have a library that does this such as pickle in python
      // calling updateStats instead of making a copy constructor for gameStat object because i already have the update
      this.mostRecent = {
        opponent: track.mostRecent.opponent,
        opponentCharID: track.mostRecent.opponentCharID,
        characterID: track.mostRecent.characterID,
        stageID: track.mostRecent.stageID,
        stats: new gameStat(null,userInfo).updateStats(track.mostRecent.stats),
        opStats: new gameStat(null,userInfo).updateStats(track.mostRecent.opStats)
      };
      this.char1.character = track.char1.character;
      this.char2.character = track.char2.character;
      // ------------------------------------------
      this.total.stats.updateStats(track.total.stats);
      this.char1.total.updateStats(track.char1.total);
      this.char2.total.updateStats(track.char2.total);
      // make new objects for the stages and update them
      var i;
      var length = this.char1.stages.length;
      for (i = 0; i < length; i++) {
        this.char1.stages[i] = new gameStat(null,userInfo).updateStats(track.char1.stages[i]);
        this.char2.stages[i] = new gameStat(null,userInfo).updateStats(track.char2.stages[i]);
        this.total.stages[i] = new gameStat(null,userInfo).updateStats(track.total.stages[i]);
      }
      // make new objects for the players then update
      for (let player in track.total.players) {
        this.total.players[player] = new gameStat(null,userInfo).updateStats(track.total.players[player]);
        if (track.char1.players[player]) {
          for (let stat of track.char1.players[player]) {
            if (!this.char1.players[player]) {
              this.char1.players[player] = [];
            }
            this.char1.players[player].push(new gameStat(null,userInfo).updateStats(stat));
          }
        }
        if (track.char2.players[player]) {
          for (let stat of track.char2.players[player]) {
            if (!this.char2.players[player]) {
              this.char2.players[player] = [];
            }
            this.char2.players[player].push(new gameStat(null,userInfo).updateStats(stat));
          }
        }
      }

    }
    else {
      this.mostRecent = {
        opponent: "",
        opponentCharID: 0,
        characterID: 0,
        stageID: 0,
        stats: new gameStat(null,userInfo),
        opStats: new gameStat(null,userInfo,true)
      };

      var i;
      var length = this.char1.stages.length;
      for (i = 0; i < length; i++) {
        this.char1.stages[i] = new gameStat(null,userInfo);
        this.char2.stages[i] = new gameStat(null,userInfo);
        this.total.stages[i] = new gameStat(null,userInfo);
      }
    }
  }

  addGame(game: SlippiGame, opponentMap: Map, stageMap: number[],userInfo: userInfo) {
    let metaData = game.getMetadata();
    let settings = game.getSettings();
    let self: any;
    let opponent: any;
    // maybe turn this into function
    // changed metadata to settings
    let player: any = metaData?.players?.[0];
    if(player !== undefined){
      if (player?.names && metaData?.players?.[1]?.names) {
        console.log(player.names)
        console.log("woah there")
        if (player?.names?.code == userInfo.userCode) {
          self = metaData?.players?.[0];
          opponent = metaData?.players?.[1];
        }
        else {
          self = metaData?.players?.[1];
          opponent = metaData?.players?.[0];
        }
        let selfID = Number(Object.keys(Object(self?.characters))[0]);
        let opponentID = Number(Object.keys(Object(opponent?.characters))[0]);
        let opponentCode = String(opponent.names.code);
        let stageID = Number(settings?.stageId);
        this.categorize(new gameStat(game,userInfo),game, selfID, opponentID, opponentCode, stageID, opponentMap, stageMap,userInfo);
      }
      else {
        console.log("undefined players");
        console.log(settings?.stageId);
      }
    }
    else{
      console.log("player undefined")
    }
    

  }

  categorize(game: gameStat,slipGame: SlippiGame, selfID: number, opponentID: number, opponentCode: string, stageID: number, opponentMap: Map, stageMap: number[],userInfo: userInfo) {
    if (stageID < 35) {
      let main = this.char1;
      let secondary = this.char2;

      if (main.character == selfID) {
        main.total.updateStats(game);
        main.stages[stageID].updateStats(game);
        if (!main.players[opponentCode]) {
          // could be more efficient 
          main.players[opponentCode] = Array(35).fill(undefined).map(undef => new gameStat(null,userInfo));
        }
        main.players[opponentCode][stageID].updateStats(game);
      } else if (secondary.character == selfID) {

        secondary.total.updateStats(game);
        secondary.stages[stageID].updateStats(game);
        if (!secondary.players[opponentCode]) {
          secondary.players[opponentCode] = Array(35).fill(undefined).map(undef => new gameStat(null,userInfo));
        }

        secondary.players[opponentCode][stageID].updateStats(game);
      } else {
        console.log("not your main or secondary");
      }
      //update total stats and most recent played
      this.total.stats.updateStats(game);
      this.total.stages[stageID].updateStats(game);
      if (!this.total.players[opponentCode]) {
        this.total.players[opponentCode] = new gameStat(null,userInfo);
      }
      this.total.players[opponentCode].updateStats(game);

      // check the list of players to see if you have played this opponent before if not then push onto set
      // this set is checked later to see if matchup stats have been modified this session and therefore should be sent to server
      if (!opponentMap[opponentCode]) {
        opponentMap[opponentCode] = [stageID];
        if (!stageMap.find(id => id === stageID)) {
          stageMap.push(stageID);
        }
      }
      else if (!opponentMap[opponentCode].find(id => id === stageID)) {
        opponentMap[opponentCode].push(stageID);
        if (!stageMap.find(id => id === stageID)) {
          stageMap.push(stageID);
        }
      }
      this.mostRecent = {
        opponent: opponentCode,
        opponentCharID: opponentID,
        characterID: selfID,
        stageID: stageID,
        stats: new gameStat(null,userInfo).updateStats(game),
        opStats: new gameStat(slipGame,userInfo,true)
      };
    }
    else {
      console.log(stageID);
    }
  }
}
