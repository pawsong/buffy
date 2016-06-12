import wrap from '@pasta/helper/lib/wrap';
import validateUsername, {
  ValidationResult as UsernameValidationResult,
} from '@pasta/helper/lib/validateUsername';
import User from '../../models/User';
import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';
import s3 from '../../s3';
import * as conf from '@pasta/config';

export const usernameExists = wrap(async (req, res) => {
  const { username } = req.params;
  if (!username) return res.send(400);

  const user = await User.findOne({ username }, { _id: true });
  return res.send({ result: !!user });
});

export const getUserByUsername = compose(requiresLogin, wrap(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).exec();
  if (!user) return res.send(404);

  return res.send(user);
}));

export const getMyUserData = compose(requiresLogin, wrap(async (req, res) => {
  const user = await User.findById(req.user.id).exec();
  return res.send(user);
}));

export const updateMyUserData = compose(requiresLogin, wrap(async (req, res) => {
  if (!req.body) return res.send(400);
  if (req.body.username &&  validateUsername(req.body.username) !== UsernameValidationResult.OK) {
    return res.send(400);
  }
  const user = await User.findByIdAndUpdate(req.user.id, req.body, { runValidators: true } as any).exec();
  res.send(user);

  if (req.body.picture && user.picture /* old picture */ && req.body.picture !== user.picture) {
    // TODO: Log error
    s3.deleteObject({
      Bucket: conf.s3Bucket,
      Key: user.picture,
    }, (err) => err && console.error(err));
  }
}));

export const getFriends = compose(requiresLogin, wrap(async (req, res) => {
  const users = await User.find({}).exec();
  return res.send(users);
}));
