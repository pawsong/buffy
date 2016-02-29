import * as mongoose from 'mongoose';
const { Schema } = mongoose;

import { GameMapDocument } from './GameMap';

export interface GameUserDocument extends mongoose.Document {
  owner: string;
  home: mongoose.Types.ObjectId;
  loc: {
    map: mongoose.Types.ObjectId | GameMapDocument;
    pos: {
      x: number;
      y: number;
      z: number;
    }
    dir: {
      x: number;
      y: number;
      z: number;
    }
  }
  mesh: mongoose.Types.ObjectId;
}

const GameUserSchema = new Schema({
  owner: { type: String, sparse: true, unique: true },
  home: { type: Schema.Types.ObjectId, ref: 'GameMap' },
  loc: {
    map: { type: Schema.Types.ObjectId, ref: 'GameMap' },
    pos: {
      x: Number,
      y: Number,
      z: Number,
    },
    dir: {
      x: Number,
      y: Number,
      z: Number,
    }
  },
  mesh: { type: Schema.Types.ObjectId, ref: 'Mesh' },
});

export default mongoose.model<GameUserDocument>('GameUser', GameUserSchema);
