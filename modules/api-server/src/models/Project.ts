import * as mongoose from 'mongoose';

const secrets = [
  'fb',
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface ProjectDocument extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  desc: string;
  server: any;
  blocklyXml: string;
  scripts: any;
  voxels: any;
}

const ProjectSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  desc: String,
  server: {},
  blocklyXml: String,
  scripts: {},
  voxels: {},
});

// Duplicate the ID field.
ProjectSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<ProjectDocument>('Project', ProjectSchema);
