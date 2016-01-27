import * as mongoose from 'mongoose';
const { Schema } = mongoose;

export interface TerrainDocument extends mongoose.Document {
  map: mongoose.Types.ObjectId;
  loc: {
    x: number;
    z: number;
  }
  color: number;
}

const TerrainSchema = new Schema({
  map: { type: Schema.Types.ObjectId, ref: 'GameMap' },
  loc: {
    x: Number,
    z: Number,
  },
  color: Number,
});

// TODO: Add unique index using map + loc data.

export default mongoose.model<TerrainDocument>('Terrain', TerrainSchema);
