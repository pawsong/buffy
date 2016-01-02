import * as mongoose from 'mongoose';
const { Schema } = mongoose;

const ScriptSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  bundle: { type: String },
  sourceMap: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 60 * 5 },
});

module.exports = mongoose.model('Script', ScriptSchema);
