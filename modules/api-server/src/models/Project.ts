import * as mongoose from 'mongoose';

const { Schema } = mongoose;

export interface ProjectDocument extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  desc: string;
  server: any;
  blocklyXml: string;
  scripts: any;
}

const ProjectSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  desc: String,
  server: {},
  blocklyXml: String,
  scripts: {},
});

// Duplicate the ID field.
ProjectSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

ProjectSchema.set('toJSON', {
  virtuals: true,
});

export default mongoose.model<ProjectDocument>('Project', ProjectSchema);
