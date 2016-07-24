import wrap from '@pasta/helper/lib/wrap';

import BlogPost from '../../models/BlogPost';
import User from '../../models/User';

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
