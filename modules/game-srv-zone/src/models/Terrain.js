import mongoose, { Schema } from 'mongoose';

const TerrainSchema = new Schema({
  loc: { x: Number, y: Number },
  color: Number,
});

export default mongoose.model('Terrain', TerrainSchema);
