import * as mongoose from 'mongoose';
const { Schema } = mongoose;

export interface MeshDocument extends mongoose.Document {
  vertices: any[],
  faces: any[],
}

const MeshSchema = new Schema({
  vertices: [],
  faces: [],
});

export default mongoose.model<MeshDocument>('Mesh', MeshSchema);
