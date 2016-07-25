import wrap from '@pasta/helper/lib/wrap';
import { compose } from 'compose-middleware/lib';

import BlogPost, {BlogPostComment} from '../../models/BlogPost';
import User from '../../models/User';
import { checkLogin, requiresLogin } from '../../middlewares/auth';

const PAGE_SIZE = 12;

export const getPostList = wrap(async (req, res) => {
  // TODO: Paginate
  const posts = await BlogPost.find({})
    .sort('-createdAt')
    .populate('author')
    .exec();

  res.send(posts);
});

export const getPost = wrap(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug })
    .populate('author')
    .exec();

  if (!post) return res.sendStatus(404);

  res.send(post);
});

export const getComments = wrap(async (req, res) => {
  const { blogId } = req.params;
  const conditions: any = { parent: blogId };
  if (req.query.before) conditions.createdAt = { $lt: req.query.before };

  const results = await BlogPostComment
    .find(conditions)
    .populate('user', '_id name username picture')
    .sort('-createdAt')
    .limit(PAGE_SIZE)
    .exec();

  res.send(results);
});

export const createComment = compose(requiresLogin, wrap(async (req, res) => {
  const { blogId } = req.params;
  const { body } = req.body;

  const comment = new BlogPostComment({
    parent: blogId,
    user: req.user.id,
    body,
  });

  await comment.save();

  res.send(Object.assign(comment.toJSON(), {
    user: req['userDoc'],
  }));
}));

export const updateComment = compose(requiresLogin, wrap(async (req, res) => {
  const { blogId, commentId, version } = req.params;
  const { body } = req.body;

  const comment = await BlogPostComment.findOneAndUpdate({
    _id: commentId,
    __v: version,
    user: req.user.id,
  }, { body }, { new: true })
    .populate('user', '_id name username picture')
    .exec();

  if (!comment) return res.sendStatus(400);

  res.send(comment);
}));

export const deleteComment = compose(requiresLogin, wrap(async (req, res) => {
  const { blogId, commentId } = req.params;

  const comment = await BlogPostComment.findOneAndRemove({
    _id: commentId,
    user: req.user.id,
  }).exec();
  if (!comment) return res.sendStatus(400);

  res.sendStatus(200);
}));
