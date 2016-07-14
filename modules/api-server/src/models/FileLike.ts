import * as mongoose from 'mongoose';

const secrets = [
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface FileLikeDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  file: string;
  createdAt: Date;
}

const FileLikeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  file: { type: Schema.Types.ObjectId, ref: 'File' },
  createdAt: { type: Date, default: Date.now },
});
FileLikeSchema.index({ file: true, user: true }, { unique: true });

export default mongoose.model<FileLikeDocument>('FileLike', FileLikeSchema);
