import * as mongoose from 'mongoose';

const secrets = [
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface FileDocument extends mongoose.Document {
  // Metadata
  owner: mongoose.Types.ObjectId;
  name: string;
  desc: string;
  thumbnail: string;
  createdAt: Date;
  modifiedAt: Date;
  isPublic: boolean;
  forkRoot: mongoose.Types.ObjectId;
  forkParent: mongoose.Types.ObjectId;
  forked: number;

  // Data
  format: string;
  bucket: string;
}

const FileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  desc: String,
  thumbnail: String,
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  isPublic: Boolean,
  forkRoot: { type: Schema.Types.ObjectId, ref: 'File' },
  forkParent: { type: Schema.Types.ObjectId, ref: 'File' },
  forked: { type: Number, default: 0 },

  format: String,
  bucket: String,
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
