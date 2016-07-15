import * as mongoose from 'mongoose';

const secrets = [
  '_id',
];

const { Schema } = mongoose;

export interface FileCommentDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  file: mongoose.Types.ObjectId;
  createdAt: Date;
  modifiedAt: Date;
  body: string;
}

const FileCommentSchema = new Schema({
  file: { type: Schema.Types.ObjectId, ref: 'File' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  body: { type: String, default: '' },
});
FileCommentSchema.index({ file: true, createdAt: true });

// Duplicate the ID field.
FileCommentSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

FileCommentSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<FileCommentDocument>('FileComment', FileCommentSchema);
