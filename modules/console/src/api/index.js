import express from 'express';
import bodyParser from 'body-parser';
import request from 'superagent';
import zlib from 'zlib';
import gm from 'gm';
import r from 'request';
import shortid from 'shortid';
import jwt from 'jsonwebtoken';
import { User } from '@pasta/mongodb';
import s3 from '../s3';
import config from '@pasta/config-public';
import iConfig from '@pasta/config-internal';
import { wrap } from '@pasta/helper-internal';

const DOMAIN = config.domain ? '.' + config.domain : '';

const api = express();

api.use(bodyParser.json());
api.post('/login/anonymous', wrap(async (req, res) => {
  const token = jwt.sign({
    id: new User()._id, // Fake ID generator
    anonymous: true,
  }, iConfig.jwtSecret);

  res.cookie('tt' /* tiat token */, token, {
    domain: DOMAIN,
    httpOnly: true,
    maxAge: 2592000000, // 1 Month
  });

  res.send({
    picture: '',
  });
}));

api.post('/login/facebook', wrap(async (req, res) => {
  const { token: fbToken } = req.body || {};

  // Request data with token.
  let profile;
  try {
    profile = await request
      .get('https://graph.facebook.com/me')
      .query({ fields: 'id,name,picture' })
      .set('Accept', 'application/json')
      .set('Authorization', `OAuth ${fbToken}`)
      .exec();
  } catch(err) {
    if (err.status !== 401) {
      throw err;
    }
    return res.status(401).send();
  }

  let user = await User.findOne({
    'fb_id': profile.id,
  });

  if (!user) {
    const pictureUrl = profile.picture.data.url;
    const { headers } = await new Promise((resolve, reject) => {
      r.head(pictureUrl, (err, res) => err ? reject(err) : resolve(res));
    });

    const stdout = await new Promise((resolve, reject) => {
      gm(r(pictureUrl))
        .resize('128', '128')
        .stream((err, stdout, stderr) => {
          if (err) { return reject(err); }
          resolve(stdout);
        });
    });

    const data = await new Promise((resolve, reject) => {
      s3.upload({
        Bucket: iConfig.s3Bucket,
        Key: `profiles/${profile.id}/${shortid.generate()}`,
        Body: stdout, //resp.body,
        ACL: 'public-read',
        ContentType: headers['content-type'],
        CacheControl: 'public,max-age=31536000',
      }, (err, data) => err ? reject(err) : resolve(data));
    });

    user = new User({
      fb_id: profile.id,
      picture: data.Location,
    });
    await user.save();
  }

  const token = jwt.sign({
    id: user._id,
  }, iConfig.jwtSecret);

  res.cookie('tt' /* tiat token */, token, {
    domain: DOMAIN,
    httpOnly: true,
    maxAge: 2592000000, // 1 Month
  });

  res.send(user);
}));

api.post('/logout', wrap(async (req, res) => {
  res.clearCookie('tt', {
    domain: DOMAIN,
  }).send();
}));

export default api;
