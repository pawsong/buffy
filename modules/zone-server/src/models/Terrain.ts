import * as mongoose from 'mongoose';
const { Schema } = mongoose;

export interface TerrainDocument extends mongoose.Document {
  loc: {
    x: number;
    y: number;
  }
  color: number;
}

const TerrainSchema = new Schema({
  loc: { x: Number, y: Number },
  color: Number,
});

export default mongoose.model<TerrainDocument>('Terrain', TerrainSchema);
