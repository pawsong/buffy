import mongoose, { Schema } from 'mongoose';

const TerrainSchema = new Schema({
  loc: { x: Number, y: Number },
  color: Number,
});

module.exports = mongoose.model('Terrain', TerrainSchema);
