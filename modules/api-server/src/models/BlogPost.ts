import * as mongoose from 'mongoose';

import comment from './plugins/comment';

const secrets = [
  '_id',
  '__v',
];

const { Schema } = mongoose;

export interface BlogPostDocument extends mongoose.Document {
  // Metadata
  author: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  body: string;
  createdAt: Date;
}

const BlogPostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  slug: String,
  title: String,
  body: String,
  createdAt: { type: Date, default: Date.now },
});
BlogPostSchema.index('slug', { unique: true });

// Duplicate the ID field.
BlogPostSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

BlogPostSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    secrets.forEach(secret => {
      delete ret[secret];
    });
  },
});

BlogPostSchema.plugin(comment);

const BlogPost = mongoose.model<BlogPostDocument>('BlogPost', BlogPostSchema);
export default BlogPost;

const BlogPostComment = (BlogPost as any).createCommentModel();
export { BlogPostComment }
