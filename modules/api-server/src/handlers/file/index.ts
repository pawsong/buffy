import wrap from '@pasta/helper/lib/wrap';
import { compose } from 'compose-middleware/lib';
import * as shortid from 'shortid';
import { checkLogin } from '../../middlewares/auth';
import s3 from '../../s3';
import * as conf from '@pasta/config';

import User, { UserDocument } from '../../models/User';
import FileModel, { FileDocument } from '../../models/File';

const EXPIRES = 60;

const PAGE_SIZE = 10;

export const getFileList = wrap(async (req, res) => {
  const files = await FileModel.find({}).sort('-modifiedAt').exec();
  res.send(files);
});

export const getUserFileList = wrap(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).exec();
  if (!user) return res.send(404);

  const page = Math.floor(req.query.page || 1);
  if (page <= 0) res.send(400);

  const [files, count] = await Promise.all([
    FileModel.find({ owner: user.id }).sort('-modifiedAt')
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .exec(),
    FileModel.find({ owner: user.id })
      .count()
      .exec(),
  ]);

  res.send({ files, count });
});

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

export const updateFile = wrap(async (req, res) => {
  const { fileId } = req.params;
  const { data } = req.body;

  console.log(data);

  if (typeof data !== 'string') return res.sendStatus(400);

  const file = await FileModel.findByIdAndUpdate(fileId, {
    data,
    modifiedAt: Date.now(),
  }, { new: true }).exec();

  console.log(file);

  res.send(file);
});

export const createFile2 = compose(checkLogin, wrap(async (req, res) => {
  const owner = req.user ? req.user.id : undefined;
  const { id, name, format } = req.body;

  const file = new FileModel({ _id: id, name, format, owner });
  await file.save();

  res.send(file);
}));

const contentType = 'application/octet-stream';
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
    signedUrl, contentType,
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

  // TODO: Get this update message from aws lambda triggered by s3 event.
  await FileModel.findByIdAndUpdate(fileId, {
    modifiedAt: Date.now(),
    thumbnail: `thumbs/${fileId}/${thumbnailId}.jpeg`,
  }).exec();

  res.sendStatus(200);
}));
