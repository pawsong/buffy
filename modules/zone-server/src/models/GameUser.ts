import * as mongoose from 'mongoose';
const { Schema } = mongoose;

const secrets = [
  '_id',
  '__v',
];

export interface GameUserDocument extends mongoose.Document {
  user: string;
  loc: {
    map: mongoose.Types.ObjectId;
    pos: {
      x: number;
      y: number;
    }
  }
}

const GameUserSchema = new Schema({
  user: { type: String, sparse: true, unique: true },
  loc: {
    map: { type: Schema.Types.ObjectId },
    pos: { x: Number, y: Number, },
  },
});

// Duplicate the ID field.
GameUserSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

GameUserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<GameUserDocument>('GameUser', GameUserSchema);
