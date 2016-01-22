import * as express from 'express';
import * as httpProxy from 'http-proxy';
import * as conf from '@pasta/config';

const proxy = httpProxy.createProxyServer();

const app = express();

// Code editor server
const addonCodeEditorServerUrl =
  process.env.PASTA_ADDON_CODE_EDITOR_SERVER_URL ||
  `http://localhost:${conf.addonCodeEditorServerPort}`;

app.use('/code-editor', (req, res, next) => {
  proxy.web(req, res, { target: addonCodeEditorServerUrl }, next);
});

// Voxel editor server
const addonVoxelEditorServerUrl =
  process.env.PASTA_ADDON_VOXEL_EDITOR_SERVER_URL ||
  `http://localhost:${conf.addonVoxelEditorServerPort}`;

app.use('/voxel-editor', (req, res, next) => {
  proxy.web(req, res, { target: addonVoxelEditorServerUrl }, next);
});

// Game server
const addonGameServerUrl =
  process.env.PASTA_ADDON_GAME_SERVER_URL ||
  `http://localhost:${conf.addonGameServerPort}`;

app.use('/game', (req, res, next) => {
  proxy.web(req, res, { target: addonGameServerUrl }, next);
});

export default app;
