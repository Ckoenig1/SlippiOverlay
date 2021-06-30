import { gameStat } from "../gameStat";

export interface CumulativeStats {
  total: {
    stats: gameStat;
    stages: gameStat[];
    players: {
      [player: string]: gameStat;
    };
  };
  char1: {
    character: number;
    total: gameStat;
    stages: gameStat[];
    players: {
      [player: string]: gameStat[];
    };
  };
  char2: {
    character: number;
    total: gameStat;
    stages: gameStat[];
    players: {
      [player: string]: gameStat[];
    };
  };
}
