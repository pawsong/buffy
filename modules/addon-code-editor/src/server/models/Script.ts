import * as mongoose from 'mongoose';
const { Schema } = mongoose;

export interface ScriptDocument extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  bundle: string;
  sourceMap: string;
  createdAt: Date;
}

const ScriptSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  bundle: { type: String },
  sourceMap: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 60 * 5 },
});

export default mongoose.model<ScriptDocument>('Script', ScriptSchema);
