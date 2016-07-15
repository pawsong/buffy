import * as mongoose from 'mongoose';

const secrets = [
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface FileLikeDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  file: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FileLikeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  file: { type: Schema.Types.ObjectId, ref: 'File' },
  createdAt: { type: Date, default: Date.now },
});
FileLikeSchema.index({ file: true, user: true }, { unique: true });

// Duplicate the ID field.
FileLikeSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

FileLikeSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<FileLikeDocument>('FileLike', FileLikeSchema);
