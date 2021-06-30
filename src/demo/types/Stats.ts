export interface Stats {
  wins: number;
  losses: number;
  totalGames: number;
  incompleteGames: number;
  timePlayed: number;
  kills: number;
  deaths: number;
  selfDestructs: number;
  killDeath: number;
  averageSDs: number;
  apm: number;
  openingsPerKill: number;
  avgKillPercent: number;
  comeBack2: number;
  comeBack3: number;
  comeBack4: number;
  fourStocks: number;
  actions: {
    wavedashCount: number;
    wavelandCount: number;
    airDodgeCount: number;
    dashDanceCount: number;
    spotDodgeCount: number;
    ledgegrabCount: number;
    rollCount: number;
    lCancelCount: {
      success: number,
      fail: number,
    },
    grabCount: {
      success: number,
      fail: number,
    },
    throwCount: {
      up: number,
      forward: number,
      back: number,
      down: number,
    },
    groundTechCount: {
      backward: number,
      forward: number,
      neutral: number,
      fail: number,
    },
    wallTechCount: {
      success: number,
      fail: number,
    }
  }
}
