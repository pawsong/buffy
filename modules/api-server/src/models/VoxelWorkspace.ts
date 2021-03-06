import * as mongoose from 'mongoose';
const { Schema } = mongoose;

export interface VoxelWorkspaceDocument extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  data: string;
  createdAt: Date;
  modifiedAt: Date;
}

// TODO: Store data in aws s3
const VoxelWorkspaceSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },

  // data: {
  //   sprites: {
  //     front:  [{ position: [x, y], color: [r, g, b, a] }],
  //     back:   [{ position: [x, y], color: [r, g, b, a] }],
  //     top:    [{ position: [x, y], color: [r, g, b, a] }],
  //     bottom: [{ position: [x, y], color: [r, g, b, a] }],
  //     left:   [{ position: [x, y], color: [r, g, b, a] }],
  //     right:  [{ position: [x, y], color: [r, g, b, a] }],
  //   },
  //   voxels:   [{ position: [x, y, z], color: [r, g, b, a] }],
  // }
  data: String,
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

export default mongoose.model<VoxelWorkspaceDocument>('VoxelWorkspace', VoxelWorkspaceSchema);
