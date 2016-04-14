import * as express from 'express';
import wrap from '@pasta/helper/lib/wrap';
import VoxelWorkspace from '../../models/VoxelWorkspace';
import * as conf from '@pasta/config';

export const getVoxelWorkspaceList = wrap(async (req, res) => {
  let owner = req.params.owner === 'me' ? req.user.id : req.params.owner;

  const result = await VoxelWorkspace.find({
    owner,
  }).select({
    owner: 1, name: 1, createdAt: 1,
  }).sort('-modifiedAt').exec();
  res.send(result);
});

export const getVoxelWorkspace = wrap(async (req, res) => {
  const owner = req.params.owner === 'me' ? req.user.id : req.params.owner;
  const name = req.params.name;

  const workspace = await VoxelWorkspace.findOne({
    owner,
    name,
  }).exec();

  return res.send(workspace);
});

export const createVoxelWorkspace = wrap(async (req, res) => {
  if (req.params.owner !== 'me') {
    return res.status(400).send({ message: 'owner should be me' });
  }
  let owner = req.user.id;

  const workspace = new VoxelWorkspace({
    owner: req.user.id,
    name: req.params.name,
    data: req.body.data,
  });
  const result = await workspace.save();
  res.send(result);
});

export const updateVoxelWorkspace = wrap(async (req, res) => {
  if (req.params.owner !== 'me') {
    return res.status(400).send({ message: 'owner should be me' });
  }
  let owner = req.user.id;

  const workspace = await VoxelWorkspace.findOneAndUpdate({
    owner: req.user.id,
    name: req.params.name,
  }, {
    data: req.body.data,
    modifiedAt: Date.now(),
  }).exec();

  res.sendStatus(200);
});
