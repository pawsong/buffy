import * as express from 'express';
import wrap from '@pasta/helper/lib/wrap';
import Project from '../../models/Project';
import * as conf from '@pasta/config';

export const createAnonymousProject = wrap(async (req, res) => {
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

export const createUserProject = wrap(async (req, res) => {
  if (!req.body.data) return res.send(400);

  const { userId } = req.params;

  const { blocklyXml, server, scripts, voxels } = req.body.data;

  const project = new Project({
    owner: userId,
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

export const getAnonymousProject = wrap(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.send(404);
  res.send(project);
});

export const getUserProject = wrap(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.send(404);
  res.send(project);
});
