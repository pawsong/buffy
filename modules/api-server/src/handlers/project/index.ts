import * as express from 'express';
import wrap from '@pasta/helper/lib/wrap';
import User, { UserDocument } from '../../models/User';
import Project from '../../models/Project';
import * as conf from '@pasta/config';
import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';

/**
 * List
 */
export const getMyProjectList = compose(requiresLogin, wrap(async (req, res) => {
  const user: UserDocument = req['userDoc'];
  if (!user) return res.send(404);

  const projects = await Project.find({
    owner: user.id,
  }, {
    _id: true,
    name: true,
    desc: true,
  });

  res.send(projects);
}));

export const getUserProjectList = wrap(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).exec();
  if (!user) return res.send(404);

  const projects = await Project.find({
    owner: user.id,
  }, {
    _id: true,
    name: true,
    desc: true,
  });

  res.send(projects);
});

/*
 * Create
 */
export const createAnonProject = wrap(async (req, res) => {
  if (!req.body.data) return res.send(400);

  const { blocklyXml, server, scripts, voxels } = req.body.data;

  const project = new Project({
    name: '',
    desc: '',
    server,
    blocklyXml,
    scripts,
    voxels,
  });

  await project.save();

  res.send({ id: project.id });
});

export const createUserProject = compose(requiresLogin, wrap(async (req, res) => {
  if (!req.body.data) return res.send(400);

  const user: UserDocument = req['userDoc'];
  const { blocklyXml, server, scripts, voxels } = req.body.data;

  const project = new Project({
    owner: user._id,
    name: '',
    desc: '',
    server,
    blocklyXml,
    scripts,
    voxels,
  });

  await project.save();

  res.send({ username: user.username, id: project.id });
}));

/*
 * Update
 */
export const updateAnonProject = wrap(async (req, res) => {
  const { blocklyXml, server, scripts, voxels } = req.body.data;

  const project = await Project.findByIdAndUpdate(req.params.projectId, {
    server,
    blocklyXml,
    scripts,
    voxels,
  });

  if (!project) return res.send(404);
  res.send(project);
});

export const updateUserProject = compose(requiresLogin, wrap(async (req, res) => {
  const { blocklyXml, server, scripts, voxels } = req.body.data;

  const project = await Project.findOneAndUpdate({
    _id: req.params.projectId,
    owner: req.user.id,
  } , {
    server,
    blocklyXml,
    scripts,
    voxels,
  });

  if (!project) return res.send(404);
  res.send(project);
}));

/*
 * Get
 */
export const getAnonProject = wrap(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.send(404);
  res.send(project);
});

export const getUserProject = wrap(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.send(404);
  res.send(project);
});
