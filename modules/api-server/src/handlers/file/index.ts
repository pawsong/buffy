import * as mongoose from 'mongoose';
import wrap from '@pasta/helper/lib/wrap';
import { compose } from 'compose-middleware/lib';
import * as shortid from 'shortid';
import { checkLogin, requiresLogin } from '../../middlewares/auth';
import s3 from '../../s3';
import * as conf from '@pasta/config';

import User, { UserDocument } from '../../models/User';
import FileModel, {
  FileDocument,
  FileComment,
} from '../../models/File';
import FileLikeModel, { FileLikeDocument } from '../../models/FileLike';

const EXPIRES = 60;

const PAGE_SIZE = 12;

export const getFileList = wrap(async (req, res) => {
  const conditions: any = { isPublic: true };
  if (req.query.before) conditions.modifiedAt = { $lt: req.query.before };

  const query = FileModel.find(conditions)
    .populate('owner', '_id username')
    .populate({
      path: 'forkParent',
      model: 'File',
      select: '_id name owner',
      populate: {
        path: 'owner',
        model: 'User',
        select: '_id username',
      },
    } as any)
    .limit(PAGE_SIZE);

  const sort = req.query.sort || '-modifiedAt';
  switch (sort) {
    case '-modifiedAt': {
      query.sort('-modifiedAt');
      break;
    }
    case '-likeCount': {
      query.sort('-likeCount');
      break;
    }
    case '-forked': {
      query.sort('-forked');
      break;
    }
  }

  const files = await query.exec();
  res.send(files);
});

export const getUserFileList = compose(checkLogin, wrap(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).exec();
  if (!user) return res.send(404);

  const query: any = { owner: user.id };
  if (!req.user || req.user.id !== user._id.toHexString()) query.isPublic = true;
  if (req.query.before) query.modifiedAt = { $lt: req.query.before };

  const files = await FileModel.find(query)
    .populate('owner', '_id username')
    .populate({
      path: 'forkParent',
      model: 'File',
      select: '_id name owner',
      populate: {
        path: 'owner',
        model: 'User',
        select: '_id username',
      },
    } as any)
    .sort('-modifiedAt')
    .limit(PAGE_SIZE)
    .exec();

  res.send(files);
}));

export const getFile = compose(checkLogin, wrap(async (req, res) => {
  const { fileId } = req.params;

  const file = await FileModel.findById(fileId)
    .populate('owner', '_id username')
    .populate({
      path: 'forkParent',
      model: 'File',
      select: '_id name owner',
      populate: {
        path: 'owner',
        model: 'User',
        select: '_id username',
      },
    } as any)
    .exec();

  if (!file) {
    return res.sendStatus(404);
  } else if (!file.isPublic) {
    if (!req.user || req.user.id !== (file.owner as any)._id.toHexString()) {
      return res.sendStatus(404);
    }
  }

  res.send(file);
}));

export const createFile = wrap(async (req, res) => {
  const { data } = req.body;

  if (typeof data !== 'string') return res.sendStatus(400);

  const file = new FileModel({ data });
  await file.save();

  res.send(file);
});

export const updateFile = compose(checkLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const params = req.body;

  const file = await FileModel.findById(fileId).exec();
  if (!file) return res.sendStatus(404);

  if (file.owner) {
    if (!req.user || req.user.id !== file.owner.toHexString()) return res.sendStatus(403);
  }

  params.modifiedAt = Date.now();
  await FileModel.findByIdAndUpdate(fileId, params).exec();

  res.sendStatus(200);
}));

export const createFile2 = compose(checkLogin, wrap(async (req, res) => {
  const owner = req.user ? req.user.id : undefined;
  const { id, name, format, isPublic, forkParent } = req.body;

  const file = new FileModel({
    _id: id,
    name,
    format,
    owner,
    isPublic: isPublic === true,
  });

  if (forkParent) {
    const parent = await FileModel.findById(forkParent).exec();
    if (parent && parent.isPublic) {
      file.forkParent = parent._id;
      file.forkRoot = parent.forkRoot || parent._id;
    }
  }

  await file.save();

  res.send(file);

  if (file.forkRoot) {
    await FileModel.findByIdAndUpdate(file.forkParent.toHexString(), {
      $inc: { forked: 1 },
    });
  }
}));

export const deleteFile = compose(requiresLogin, wrap(async (req, res) => {
  const { fileId } = req.params;

  const file = await FileModel.findOneAndRemove({
    _id: fileId,
    owner: req.user.id,
  }).exec();

  if (!file) return res.send(400);

  res.send(200);

  if (file.forkRoot) {
    await FileModel.findByIdAndUpdate(file.forkParent.toHexString(), {
      $inc: { forked: -1 },
    });
  }

  // TODO: Log error
  s3.deleteObject({
    Bucket: conf.s3Bucket,
    Key: `files/${fileId}`,
  }, (err) => err && console.error(err));

  s3.deleteObject({
    Bucket: conf.s3Bucket,
    Key: file.thumbnail,
  }, (err) => err && console.error(err));
}));

const contentType = 'application/octet-stream';
const cacheControl = 'no-cache, no-store, must-revalidate';
const thumbnailContentType = 'image/jpeg';
const thumbnailCacheControl = 'max-age=1209600, no-transform';

export const issueFileUpdateUrl = compose(checkLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const file = await FileModel.findById(fileId).exec();
  if (!file) return res.sendStatus(404);

  if (file.owner) {
    if (!req.user || req.user.id !== file.owner.toHexString()) return res.sendStatus(403);
  }

  const params = {
    Bucket: conf.s3Bucket,
    Key: `files/${fileId}`,
    ACL: 'public-read',
    Expires: EXPIRES,
    ContentType: contentType,
    CacheControl: cacheControl,
  };

  const thumbnailId = shortid.generate();
  const thumbnailParams = {
    Bucket: conf.s3Bucket,
    Key: `thumbs/${fileId}/${thumbnailId}.jpeg`,
    ACL: 'public-read',
    Expires: EXPIRES,
    ContentType: 'image/jpeg',
    CacheControl: thumbnailCacheControl,
  };

  const [signedUrl, thumbnailSignedUrl] = await Promise.all([
    new Promise((resolve, reject) => {
      s3.getSignedUrl('putObject', params, (err, url) => err ? reject(err) :resolve(url));
    }),
    new Promise((resolve, reject) => {
      s3.getSignedUrl('putObject', thumbnailParams, (err, url) => err ? reject(err) :resolve(url));
    }),
  ]);

  return res.send({
    signedUrl, contentType, cacheControl,
    thumbnailId,
    thumbnailSignedUrl, thumbnailContentType, thumbnailCacheControl,
  });
}));

export const reportUpdate = compose(checkLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const { thumbnailId } = req.body;

  if (!thumbnailId) return res.sendStatus(400);

  const file = await FileModel.findById(fileId).exec();
  if (!file) return res.sendStatus(404);

  if (file.owner) {
    if (!req.user || req.user.id !== file.owner.toHexString()) return res.sendStatus(403);
  }

  const oldThumbnail = file.thumbnail;

  // TODO: Get this update message from aws lambda triggered by s3 event.
  await FileModel.findByIdAndUpdate(fileId, {
    modifiedAt: Date.now(),
    thumbnail: `thumbs/${fileId}/${thumbnailId}.jpeg`,
  }).exec();

  res.sendStatus(200);

  // TODO: Remove old thumbnails properly
  // Currently we do not delete old thumbnails on file update because there might be
  // social media caches that still reference old thumbanil images.
  // This causes storage inflation so we have to find a way to handle this obsolete images properly...

  // if (oldThumbnail) {
  //   // TODO: Log error
  //   s3.deleteObject({
  //     Bucket: conf.s3Bucket,
  //     Key: oldThumbnail,
  //   }, (err) => err && console.error(err));
  // }
}));

export const changeLikeStatus = compose(requiresLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const { liked } = req.body;

  if (liked) {
    const doc = await FileLikeModel.findOneAndUpdate({ file: fileId, user: req.user.id }, {
      createdAt: Date.now(),
    }, { upsert: true }).exec();
    if (!doc) {
      // Document is created
      await FileModel.findByIdAndUpdate(fileId, { $inc: { likeCount: 1 } });
    }
  } else {
    const doc: any = await FileLikeModel.remove({ file: fileId, user: req.user.id }).exec();
    const deletedCount = doc.result.n;
    if (deletedCount > 0) {
      await FileModel.findByIdAndUpdate(fileId, { $inc: { likeCount: -deletedCount } });
    }
  }

  return res.sendStatus(200);
}));

export const checkLikeStatus = wrap(async (req, res) => {
  const { fileId, username } = req.params;
  const user = await User.findOne({ username }).exec();
  if (!user) return res.sendStatus(400);

  const result = await FileLikeModel.findOne({ file: fileId, user: user._id }).exec();

  res.send({ liked: !!result });
});

export const getLikes = wrap(async (req, res) => {
  const { fileId } = req.params;
  const conditions: any = { file: fileId };
  if (req.query.before) conditions.createdAt = { $lt: req.query.before };

  const results = await FileLikeModel
    .find(conditions)
    .populate('user', '_id name username picture')
    .sort('-createdAt')
    .limit(PAGE_SIZE)
    .exec();

  res.send(results);
});

export const getComments = wrap(async (req, res) => {
  const { fileId } = req.params;
  const conditions: any = { parent: fileId };
  if (req.query.before) conditions.createdAt = { $lt: req.query.before };

  const results = await FileComment
    .find(conditions)
    .populate('user', '_id name username picture')
    .sort('-createdAt')
    .limit(PAGE_SIZE)
    .exec();

  res.send(results);
});

export const createComment = compose(requiresLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const { body } = req.body;

  const comment = new FileComment({
    parent: fileId,
    user: req.user.id,
    body,
  });

  await comment.save();

  res.send(Object.assign(comment.toJSON(), {
    user: req['userDoc'],
  }));
}));

export const updateComment = compose(requiresLogin, wrap(async (req, res) => {
  const { fileId, commentId, version } = req.params;
  const { body } = req.body;

  const comment = await FileComment.findOneAndUpdate({
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
  const { fileId, commentId } = req.params;

  const comment = await FileComment.findOneAndRemove({
    _id: commentId,
    user: req.user.id,
  }).exec();
  if (!comment) return res.sendStatus(400);

  res.sendStatus(200);
}));
