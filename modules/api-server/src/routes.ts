import * as express from 'express';
import wrap from '@pasta/helper/lib/wrap';
import VoxelWorkspace from './models/VoxelWorkspace';
import Project from './models/Project';
import * as conf from '@pasta/config';

const pkg = require('../package.json');

import * as authHandlers from './handlers/auth';
import * as cdnHandlers from './handlers/cdn';
import * as courseHandlers from './handlers/course';
import * as projectHandlers from './handlers/project';
import * as userHandlers from './handlers/user';
import * as voxelWorkspaceHandlers from './handlers/voxelWorkspace';
import * as fileHandlers from './handlers/file';

import * as a from './middlewares/auth';

export default (app: express.Express) => {
  app.get('/', (req, res) => {
    res.send({
      name: pkg.name,
      version: pkg.version,
    });
  });

  app.get ('/signup/local/exists/:email', authHandlers.checkIfEmailExists);
  app.post('/signup/local', authHandlers.signupWithLocal);
  app.post('/login/local', authHandlers.loginWithLocal);
  app.post('/login/facebook', authHandlers.loginWithFacebook);
  app.post('/logout', authHandlers.logout);
  app.post('/password/update', authHandlers.updatePassword);

  app.get ('/courses', courseHandlers.getCourseList);
  app.get ('/courses/:courseId', courseHandlers.getCourseById);

  // Create and update project
  app.post('/projects/anonymous', projectHandlers.createAnonProject);
  app.put ('/projects/anonymous/:projectId', projectHandlers.updateAnonProject);
  app.get ('/projects/anonymous/:projectId', projectHandlers.getAnonProject);

  app.get ('/projects/me', projectHandlers.getMyProjectList);
  app.post('/projects/user', projectHandlers.createUserProject);
  app.put ('/projects/user/:projectId', projectHandlers.updateUserProject);
  app.get ('/projects/@:username', projectHandlers.getUserProjectList);
  app.get ('/projects/@:username/:projectId', projectHandlers.getUserProject);

  app.get ('/username-exists/:username', userHandlers.usernameExists);
  app.get ('/users/:username', userHandlers.getUserByUsername);
  app.get ('/me', userHandlers.getMyUserData);
  app.put ('/me', userHandlers.updateMyUserData);
  app.get ('/friends', userHandlers.getFriends);

  app.get ('/voxel-workspaces/:owner', voxelWorkspaceHandlers.getVoxelWorkspaceList);
  app.get ('/voxel-workspaces/:owner/:name', voxelWorkspaceHandlers.getVoxelWorkspace);
  app.post('/voxel-workspaces/:owner/:name', voxelWorkspaceHandlers.createVoxelWorkspace);
  app.put ('/voxel-workspaces/:owner/:name', voxelWorkspaceHandlers.updateVoxelWorkspace);

  app.post ('/cdn/signed-url/profile', cdnHandlers.issueS3SignedUrlForProfile);

  app.post('/files', fileHandlers.createFile2);
  app.post('/files/:fileId/issue-update-url', fileHandlers.issueFileUpdateUrl);
  app.post('/files/:fileId/report-update', fileHandlers.reportUpdate);

  app.get    ('/files', fileHandlers.getFileList);
  app.get    ('/files/@:username', fileHandlers.getUserFileList);
  app.get    ('/files/:fileId', fileHandlers.getFile);
  app.put    ('/files/:fileId', fileHandlers.updateFile);
  app.delete ('/files/:fileId', fileHandlers.deleteFile);
  app.put    ('/files/:fileId/likes', fileHandlers.changeLikeStatus);
  app.get    ('/files/:fileId/likes/:username', fileHandlers.checkLikeStatus);
  app.get    ('/files/:fileId/likes', fileHandlers.getLikes);
  app.get    ('/files/:fileId/comments', fileHandlers.getComments);
  app.post   ('/files/:fileId/comments', fileHandlers.createComment);
  app.put    ('/files/:fileId/comments/:commentId/:version', fileHandlers.updateComment);
  app.delete ('/files/:fileId/comments/:commentId', fileHandlers.deleteComment);
};
