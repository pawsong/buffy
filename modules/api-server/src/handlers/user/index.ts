import wrap from '@pasta/helper/lib/wrap';
import User from '../../models/User';
import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';

export const getUserById = compose(requiresLogin, wrap(async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.sendStatus(401);
  }
  const user = await User.findById(req.user.id).exec();
  return res.send(user);
}));

export const getMyUserData = compose(requiresLogin, wrap(async (req, res) => {
  const user = await User.findById(req.user.id).exec();
  return res.send(user);
}));

export const updateMyUserData = compose(requiresLogin, wrap(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body).exec();
  return res.send(user);
}));

export const getFriends = compose(requiresLogin, wrap(async (req, res) => {
  const users = await User.find({}).exec();
  return res.send(users);
}));
