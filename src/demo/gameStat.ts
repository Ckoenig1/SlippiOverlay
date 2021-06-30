import { SlippiGame, StatsType, StockType } from "@ckoenig1/slippi-js"
import { Stats } from './types/Stats';









export class gameStat implements Stats {
  wins = 0;
  losses = 0;
  totalGames = 0;
  incompleteGames = 0;
  timePlayed = 0;
  kills = 0;
  deaths = 0;
  selfDestructs = 0;
  killDeath = 0;
  averageSDs = 0;
  apm = 0;
  openingsPerKill = 0;
  avgKillPercent = 0;
  comeBack2 = 0;
  comeBack3 = 0;
  comeBack4 = 0;
  fourStocks = 0;
  actions = {
    wavedashCount: 0,
    wavelandCount: 0,
    airDodgeCount: 0,
    dashDanceCount: 0,
    spotDodgeCount: 0,
    ledgegrabCount: 0,
    rollCount: 0,
    lCancelCount :{
      success: 0,
      fail: 0,
    },
    grabCount: {
      success: 0,
      fail: 0,
    },
    throwCount: {
      up: 0,
      forward: 0,
      back: 0,
      down: 0,
    },
    groundTechCount: {
      backward: 0,
      forward: 0,
      neutral: 0,
      fail: 0,
    },
    wallTechCount: {
      success: 0,
      fail: 0,
    },
  }
  constructor(game: SlippiGame | null, userInfo:{main:number,secondary:number,userCode:string}, opponentFlag:boolean = false) {
    if (game !== null) {
      const stats = game.getStats();
      if (!stats?.overall) {
        console.log("something wrong");
      }
      else {
        // this stopped working with a version update now using the gamecomplete stat
        //let gameComplete = (stats?.overall[0].killCount == 4 || stats?.overall[1].killCount == 4);
       
        
        // if the game wasnt a ragequit or disconnect calc stats
        if (stats?.gameComplete) {
          let metaData = game.getMetadata();
          let selfIndex = 0;

          // get action counts
          // nobody ever updated the types of action counts so i need to cast to any to assign even though it should have all the fields
          this.actions = <any>stats?.actionCounts[0]
        
          // maybe turn this into function
          // figures out which index corresponds to the user for use in analyzing stocks
          let player: any = metaData?.players?.[0];
          if (player.names.code == userInfo.userCode) {
            if(opponentFlag){
              selfIndex = 1;
            }
            else{
              selfIndex = 0;
            }
            

          }
          else {
            if(opponentFlag){
              selfIndex = 0;
            }
            else{
              selfIndex = 1;
            }
            
          }
          

          this.totalGames += 1;
          // time in seconds
          this.timePlayed += (stats?.lastFrame / 60);
          // sort stocks by frame to get chronological order
          let stocks = stats?.stocks.filter((stock: StockType) => stock.endFrame !== null && stock.endFrame !== undefined);
          stocks = stocks.sort((a: StockType, b: StockType) => {
            if (a.endFrame && b.endFrame) {
              return a?.endFrame - b?.endFrame;
            }
            else {
              console.log("ruhroh dumbass");
              return 0;
            }
          });

          var i;
          var selfStocks = 4;
          var opponentStocks = 4;
          var comeBack = false;
          var comeBackCount = 0;
          var stock;

          for (i = 0; i < stocks.length; i++) {
            stock = stocks[i];
            if (stock.playerIndex == selfIndex) {
              selfStocks--;
              comeBack = false;
              if (this.selfDestruct(stock, stats, selfIndex)) {
                this.selfDestructs++;
              }
            }
            else {
              opponentStocks--;
              this.avgKillPercent += stock.endPercent!;
            }
            if (selfStocks == 1 && comeBack == false) {
              comeBackCount = opponentStocks;
              comeBack = true;
            }
          }
          //avgsd
          this.averageSDs = this.selfDestructs / this.totalGames;
          // kills / deaths
          this.kills += 4 - opponentStocks;
          this.deaths += 4 - selfStocks;
          // apm
          this.apm = stats?.overall[selfIndex].digitalInputsPerMinute.ratio!;

          // openings per kill
          this.openingsPerKill = stats?.overall[selfIndex].openingsPerKill.ratio!;

          // avgKillPercent
          this.avgKillPercent = this.avgKillPercent / ((4 - opponentStocks) || 1);

          // k/d must account for no deaths
          this.killDeath = 4.0 - opponentStocks / (4.0 - selfStocks || 1);

          // fourstocks
          if (selfStocks == 4) {
            this.fourStocks++;
          }

          // comebacks
          if (comeBack) {
            switch (comeBackCount) {
              case 1:
                break;
              case 2:
                this.comeBack2++;
                break;
              case 3:
                this.comeBack3++;
                break;
              case 4:
                this.comeBack4++;
                break;
            }
          }
          // opponent has zero stocks you win
          if (opponentStocks == 0) {
            this.wins++;
          } else {
            this.losses++;
          }
        }
        else {
          this.incompleteGames += 1;
        }
      }
    }

  }

  toString(): string {
    // returns string representation exlcuding the last } so that other properties can be added
    // not using JSON stringify because it puts keys in quotes and includes the object name in the string
    return "{" +
      "wins: " + this.wins
      + ",losses: " + this.losses
      + ",incompleteGames: " + this.incompleteGames
      + ",totalGames: " + this.totalGames
      + ",timePlayed: " + this.timePlayed
      + ",selfDestructs: " + this.selfDestructs
      + ",openingsPerKill: " + this.openingsPerKill
      + ",kills: " + this.kills
      + ",killDeath: " + this.killDeath
      + ",deaths: " + this.deaths
      + ",fourStocks: " + this.fourStocks
      + ",comeBack4: " + this.comeBack4
      + ",comeBack3: " + this.comeBack3
      + ",comeBack2: " + this.comeBack2
      + ",avgKillPercent: " + this.avgKillPercent
      + ",averageSDs: " + this.averageSDs
      + ",apm: " + this.apm;
  }

  selfDestruct(stock: any, stats: StatsType, selfIndex: number) {
    // Here we are going to grab the opponent's punishes and see if one of them was
    // responsible for ending this stock, if so show the kill move, otherwise assume SD
    let playerIndex = 1 - selfIndex;
    const punishes = stats?.conversions;

    var i;
    let conv;

    for (i = 0; i < punishes.length; i++) {
      conv = punishes[i];
      if (conv.playerIndex == playerIndex && conv.endFrame == stock.endFrame) {
        return false;
      }
    }
    return true;

  }

  sumObjectsByKey(...objs: any) {
    return objs.reduce((a: any, b: any) => {
      for (let k in b) {
        if (b.hasOwnProperty(k))
          a[k] = (a[k] || 0) + b[k];
      }
      return a;
    }, {});
  }
  


  updateStats(newStats: gameStat) {
    let totalG = (this.totalGames + newStats.totalGames);
    let totalK = this.kills + newStats.kills;
    this.apm = ((this.apm * this.totalGames) + (newStats.apm * newStats.totalGames)) / (totalG || 1);
    this.wins += newStats.wins;
    this.losses += newStats.losses;
    this.totalGames = totalG;
    this.incompleteGames += newStats.incompleteGames;
    this.timePlayed += newStats.timePlayed;
    this.deaths += newStats.deaths;
    this.selfDestructs += newStats.selfDestructs;
    this.averageSDs = this.selfDestructs / (this.totalGames || 1);
    this.openingsPerKill = ((this.openingsPerKill * this.kills) + (newStats.openingsPerKill * newStats.kills)) / (totalK || 1);
    this.avgKillPercent = ((this.avgKillPercent * this.kills) + (newStats.avgKillPercent * newStats.kills)) / (totalK || 1);
    this.kills = totalK;
    this.killDeath = this.kills / (this.deaths || 1);
    this.comeBack2 += newStats.comeBack2;
    this.comeBack3 += newStats.comeBack3;
    this.comeBack4 += newStats.comeBack4;
    this.fourStocks += newStats.fourStocks;

    this.actions.wavedashCount += newStats.actions.wavedashCount;
    this.actions.wavelandCount += newStats.actions.wavelandCount;
    this.actions.ledgegrabCount += newStats.actions.ledgegrabCount;
    this.actions.rollCount += newStats.actions.rollCount;
    this.actions.spotDodgeCount += newStats.actions.spotDodgeCount;
    this.actions.airDodgeCount +=  newStats.actions.airDodgeCount;
    this.actions.dashDanceCount += newStats.actions.dashDanceCount;
    // this.actions.grabCount = this.sumObjectsByKey(this.actions.grabCount,newStats.actions.grabCount)
    // this.actions.groundTechCount = this.sumObjectsByKey(this.actions.groundTechCount,newStats.actions.groundTechCount)
    // this.actions.lCancelCount = this.sumObjectsByKey(this.actions.lCancelCount,newStats.actions.lCancelCount)
    // this.actions.throwCount = this.sumObjectsByKey(this.actions.throwCount,newStats.actions.throwCount)
    // this.actions.wallTechCount = this.sumObjectsByKey(this.actions.wallTechCount,newStats.actions.wallTechCount)
    // console.log(newStats.actions)
    // console.log(newStats.actions.grabCount)
    // console.log(newStats.actions.grabCount.success)
    this.actions.grabCount.fail += newStats.actions.grabCount.fail;
    this.actions.grabCount.success += newStats.actions.grabCount.success;
    this.actions.groundTechCount.backward += newStats.actions.groundTechCount.backward;
    this.actions.groundTechCount.neutral += newStats.actions.groundTechCount.neutral;
    this.actions.groundTechCount.forward += newStats.actions.groundTechCount.forward ;
    this.actions.groundTechCount.fail += newStats.actions.groundTechCount.fail;
    this.actions.lCancelCount.fail += newStats.actions.lCancelCount.fail;
    this.actions.lCancelCount.success += newStats.actions.lCancelCount.success;
    this.actions.throwCount.up += newStats.actions.throwCount.up;
    this.actions.throwCount.down += newStats.actions.throwCount.down;
    this.actions.throwCount.forward+= newStats.actions.throwCount.forward;
    this.actions.throwCount.back += newStats.actions.throwCount.back;
    this.actions.wallTechCount.fail += newStats.actions.wallTechCount.fail;
    this.actions.wallTechCount.success += newStats.actions.wallTechCount.success;

    return this;
  }   
}
