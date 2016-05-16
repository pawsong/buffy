import wrap from '@pasta/helper/lib/wrap';
import { compose } from 'compose-middleware/lib';
import { checkLogin } from '../../middlewares/auth';
import s3 from '../../s3';
import * as conf from '@pasta/config';

import FileModel, { FileDocument } from '../../models/File';

const EXPIRES = 60;

export const getFileList = wrap(async (req, res) => {
  const files = await FileModel.find({}).sort('-modifiedAt').exec();
  res.send(files);
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
  const { name, format } = req.body;

  const file = new FileModel({ name, format, owner });
  await file.save();

  res.send(file);
}));

export const issueFileUpdateUrl = compose(checkLogin, wrap(async (req, res) => {
  const { fileId } = req.params;
  const file = await FileModel.findById(fileId).exec();
  if (!file) return res.sendStatus(404);

  if (file.owner) {
    if (!req.user || req.user.id !== file.owner.toHexString()) {
      return res.sendStatus(403);
    }
  }

  const contentType = 'application/octet-stream';

  const params = {
    Bucket: conf.s3Bucket,
    Key: `files/${fileId}`,
    ACL: 'public-read',
    Expires: EXPIRES,
    ContentType: contentType,
  };

  const signedUrl = await new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => err ? reject(err) :resolve(url));
  });

  // TODO: Get this update message from aws lambda triggered by s3 event.
  await FileModel.findByIdAndUpdate(fileId, { modifiedAt: Date.now() }).exec();

  return res.send({ signedUrl, contentType });
}));
