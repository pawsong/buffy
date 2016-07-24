import * as mongoose from 'mongoose';

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
BlogPostSchema.index('slug');

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

export default mongoose.model<BlogPostDocument>('BlogPost', BlogPostSchema);
