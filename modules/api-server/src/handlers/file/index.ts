import wrap from '@pasta/helper/lib/wrap';

import FileModel, { FileDocument } from '../../models/File';

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
