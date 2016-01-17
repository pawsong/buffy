import * as mongoose from 'mongoose';
const { Schema } = mongoose;

const secrets = [
  'fb_id',
  '_id',
  '__v',
];

export interface UserDocument extends mongoose.Document {
  fb_id: string;
  picture: string;
}

const UserSchema = new Schema({
  fb_id: { type: String, sparse: true, unique: true },
  picture: { type: String },
});

// Duplicate the ID field.
UserSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<UserDocument>('User', UserSchema);
