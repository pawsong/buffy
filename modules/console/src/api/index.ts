import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as axios from 'axios';
import * as zlib from 'zlib';
import * as gm from 'gm';
import * as r from 'request';
import * as shortid from 'shortid';
import * as jwt from 'jsonwebtoken';
import User from '../models/User';
import s3 from '../s3';
import * as conf from '@pasta/config';
import wrap from '@pasta/helper/lib/wrap';

const DOMAIN = CONFIG_DOMAIN;

const api = express();

api.use(bodyParser.json());
api.post('/login/anonymous', wrap(async (req, res) => {
  const token = jwt.sign({
    id: new User()._id, // Fake ID generator
    anonymous: true,
  }, conf.jwtSecret);

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
  const fbToken = (req.body || {}).token;

  // Request data with token.
  let profile;
  try {
    profile = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,picture' },
      headers: {
        Accept: 'application/json',
        Authorization: `OAuth ${fbToken}`
      },
    }).then(res => res.data);
  } catch(err) {
    if (err.status !== 401) {
      throw err;
    }
    return res.status(401).send();
  }

  let user = await User.findOne({
    'fb_id': profile.id,
  }).exec();

  if (!user) {
    const pictureUrl = profile.picture.data.url;
    const { headers } = await new Promise<{ headers: any }>((resolve, reject) => {
      r.head(pictureUrl, (err, res) => err ? reject(err) : resolve(res));
    });

    const stdout = await new Promise((resolve, reject) => {
      gm(r(pictureUrl) as any)
        .resize(128, 128)
        .stream((err, stdout, stderr) => {
          if (err) { return reject(err); }
          resolve(stdout);
        });
    });

    const data = await new Promise<{ Location: any }>((resolve, reject) => {
      s3.upload({
        Bucket: conf.s3Bucket,
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
  }, conf.jwtSecret);

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
