'use strict';

import * as express from 'express';
import wrap from '@pasta/helper/lib/wrap';
import VoxelWorkspace from './models/VoxelWorkspace';
import Project from './models/Project';
import * as conf from '@pasta/config';

const pkg = require('../package.json');

import courses from './courses';

export default (app: express.Express) => {
  app.get('/', (req, res) => {
    res.send({
      name: pkg.name,
      version: pkg.version,
    });
  });

  app.get('/courses', (req, res) => {
    res.send(courses);
  });

  app.get('/courses/:courseId', (req, res) => {
    const { courseId } = req.params;
    const index = -1;
    for (let i = 0; i < courses.length; ++i) {
      const course = courses[i];
      if (course.id === courseId) {
        return res.send(course);
      }
    }
    res.sendStatus(400);
  });

  app.get ('/voxel-workspaces/:owner', wrap(async (req, res) => {
    let owner = req.params.owner === 'me' ? req.user.id : req.params.owner;

    const result = await VoxelWorkspace.find({
      owner,
    }).select({
      owner: 1, name: 1, createdAt: 1,
    }).sort('-modifiedAt').exec();
    res.send(result);
  }));

  app.get('/voxel-workspaces/:owner/:name', wrap(async (req, res) => {
    const owner = req.params.owner === 'me' ? req.user.id : req.params.owner;
    const name = req.params.name;

    const workspace = await VoxelWorkspace.findOne({
      owner,
      name,
    }).exec();

    return res.send(workspace);
  }));

  app.post('/voxel-workspaces/:owner/:name', wrap(async (req, res) => {
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
  }));

  app.put('/voxel-workspaces/:owner/:name', wrap(async (req, res) => {
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
  }));

  app.post('/projects', wrap(async (req, res) => {
    if (!req.body.data) return res.send(400);

    const { blocklyXml, map, scripts } = req.body.data;

    const project = new Project({
      name: '',
      desc: '',
      data: map,
      blocklyXml,
      scripts,
    });

    await project.save();
    res.send({ id: project.id });
  }));

  app.get('/projects/:projectId', wrap(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.send(404);
    res.send(project);
  }));
};
