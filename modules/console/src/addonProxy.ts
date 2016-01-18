import * as express from 'express';
import * as httpProxy from 'http-proxy';
import * as conf from '@pasta/config';

const proxy = httpProxy.createProxyServer();

const app = express();

// Code editor server
const addonCodeEditorServerUrl =
  process.env.PASTA_ADDON_CODE_EDITOR_SERVER_URL ||
  `http://localhost:${conf.addonCodeEditorServerPort}`;

app.use('/code-editor', (req, res) => {
  proxy.web(req, res, { target: addonCodeEditorServerUrl });
});

export default app;
