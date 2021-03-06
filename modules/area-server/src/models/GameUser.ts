import * as mongoose from 'mongoose';
const { Schema } = mongoose;

import { GameMapDocument } from './GameMap';

const secrets = [
  'fb',
  '_id',
  '__v',
];

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
  designId: string;
  robot: string;
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
  designId: { type: String },
  robot: { type: String },
});

// Duplicate the ID field.
GameUserSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

GameUserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<GameUserDocument>('GameUser', GameUserSchema);
