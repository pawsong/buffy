import * as mongoose from 'mongoose';
const { Schema } = mongoose;

const TerrainSchema = new Schema({
  loc: { x: Number, y: Number },
  color: Number,
});

module.exports = mongoose.model('Terrain', TerrainSchema);
