import wrap from '@pasta/helper/lib/wrap';
import { compose } from 'compose-middleware/lib';
import * as shortid from 'shortid';
import { checkLogin } from '../../middlewares/auth';
import s3 from '../../s3';
import * as conf from '@pasta/config';

import User, { UserDocument } from '../../models/User';
import FileModel, { FileDocument } from '../../models/File';

const EXPIRES = 60;

const PAGE_SIZE = 12;

export const getFileList = wrap(async (req, res) => {
  const query: any = { isPublic: true };
  if (req.query.before) query.modifiedAt = { $lt: req.query.before };

  const files = await FileModel.find(query)
    .populate('owner', '_id username')
    .sort('-modifiedAt')
    .limit(PAGE_SIZE)
    .exec();

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
    .sort('-modifiedAt')
    .limit(PAGE_SIZE)
    .exec();

  res.send(files);
}));

export const getFile = wrap(async (req, res) => {
  const { fileId } = req.params;
  const file = await FileModel.findById(fileId).exec();
  res.send(file);
});

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
  const { id, name, format, isPublic } = req.body;

  const file = new FileModel({
    _id: id,
    name,
    format,
    owner,
    isPublic: isPublic === true,
  });
  await file.save();

  res.send(file);
}));

const contentType = 'application/octet-stream';
const cacheControl = 'no-cache, no-store, must-revalidate';
const thumbnailContentType = 'image/jpeg';

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
    thumbnailSignedUrl, thumbnailContentType,
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

  if (oldThumbnail) {
    // TODO: Log error
    s3.deleteObject({
      Bucket: conf.s3Bucket,
      Key: oldThumbnail,
    }, (err) => err && console.error(err));
  }
}));
