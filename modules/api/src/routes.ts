'use strict';

import wrap from '@pasta/helper-internal/lib/wrap';
import VoxelWorkspace from '@pasta/mongodb/lib/models/VoxelWorkspace';

export default app => {
  app.get('/', (req, res) => {
    res.send({ message: 'hello!' });
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
    res.send();
  }));
};
