import * as mongoose from 'mongoose';

export interface CommentDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  createdAt: Date;
  modifiedAt: Date;
  body: string;
}

export default function comment(schema: mongoose.Schema) {
  schema['statics'].createCommentModel = function () {
    const { modelName } = this;

    const secrets = [
      '_id',
    ];

    const { Schema } = mongoose;

    const CommentSchema = new Schema({
      parent: { type: Schema.Types.ObjectId, ref: modelName },
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      modifiedAt: { type: Date, default: Date.now },
      body: { type: String, default: '' },
    });
    CommentSchema.index({ parent: true, createdAt: true });

    // Duplicate the ID field.
    CommentSchema.virtual('id').get(function(){
      return this._id.toHexString();
    });

    CommentSchema.set('toJSON', {
      virtuals: true,
      transform: function (doc, ret) {
        secrets.forEach(secret => {
          delete ret[secret];
        });
      },
    });

    return mongoose.model<CommentDocument>(`${modelName}Comment`, CommentSchema);
  };
}
