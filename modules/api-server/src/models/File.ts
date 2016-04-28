import * as mongoose from 'mongoose';

const secrets = [
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface FileDocument extends mongoose.Document {
  format: string;
  data: string;

  // meta
  owner: mongoose.Types.ObjectId;
  name: string;
  desc: string;
}

const FileSchema = new Schema({
  format: String,
  data: String,

  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  desc: String,
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

// Duplicate the ID field.
FileSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

FileSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<FileDocument>('File', FileSchema);
