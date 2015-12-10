import mongoose, { Schema } from 'mongoose';

const secrets = [
  'fb_id',
  '_id',
  '__v',
];

const UserSchema = new Schema({
  fb_id: { type: String, sparse: true, unique: true },
  picture: { type: String },
  loc: {
    map: { type: Schema.ObjectId },
    pos: { x: Number, y: Number, },
  },
});

// Duplicate the ID field.
UserSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

UserSchema.options.toJSON = {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
};

module.exports = mongoose.model('User', UserSchema);
