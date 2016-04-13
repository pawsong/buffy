import * as mongoose from 'mongoose';

const { Schema } = mongoose;

export interface ProjectDocument extends mongoose.Document {
  name: string;
  desc: string;
  server: any;
  blocklyXml: string;
  scripts: any;
}

const ProjectSchema = new Schema({
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
