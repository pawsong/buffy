import * as mongoose from 'mongoose';

const { Schema } = mongoose;

export interface GameMapDocument extends mongoose.Document {
  name: string;
  width: number;
  depth: number;
}

const GameMapSchema = new Schema({
  name: String,
  width: Number,
  depth: Number,
});

// Duplicate the ID field.
GameMapSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

GameMapSchema.set('toJSON', {
  virtuals: true,
});

export default mongoose.model<GameMapDocument>('GameMap', GameMapSchema);
