import * as crypto from 'crypto';
import * as mongoose from 'mongoose';
const { Schema } = mongoose;

const secrets = [
  'fb',
  '_id',
  '__v',
];

export interface UserDocument extends mongoose.Document {
  fb: string; // Facebook ID
  name: string;
  email: string;
  picture: string;
  password: string;
  authenticate: (password: string) => boolean;
}

const UserSchema = new Schema({
  fb: { type: String, sparse: true, unique: true },
  name: { type: String },
  email: { type: String, sparse: true, unique: true },
  picture: { type: String },
  hashedPassword: { type: String },
  salt: { type: String },
});

// Duplicate the ID field.
UserSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

UserSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

/**
 * Authenticate - check if the passwords are the same
 *
 * @param {String} plainText
 * @return {Boolean}
 * @api public
 */

UserSchema.method('authenticate', function (plainText: string) {
  return this.encryptPassword(plainText) === this.hashedPassword;
});

/**
 * Make salt
 *
 * @return {String}
 * @api public
 */

UserSchema.method('makeSalt', function () {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

/**
 * Encrypt password
 *
 * @param {String} password
 * @return {String}
 * @api public
 */

UserSchema.method('encryptPassword', function (password) {
  if (!password) return '';
  try {
    return crypto
      .createHmac('sha1', this.salt)
      .update(password)
      .digest('hex');
  } catch (err) {
    return '';
  }
})

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

export default mongoose.model<UserDocument>('User', UserSchema);
