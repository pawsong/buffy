import mongoose, { Schema } from 'mongoose';

const ScriptSchema = new Schema({
  owner: { type: Schema.ObjectId, ref: 'User' },
  bundle: { type: String },
  sourceMap: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 60 * 5 },
});

export default mongoose.model('Script', ScriptSchema);
