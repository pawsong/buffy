'use strict';

import * as gm from 'gm';
import * as shortid from 'shortid';
import * as request from 'request';
import * as Promise from 'bluebird';
import * as axios from 'axios';
import wrap from '@pasta/helper/lib/wrap';
import User from './models/User';
import s3 from './s3';
import * as jwt from 'jsonwebtoken';
import * as ejwt from 'express-jwt';
import * as conf from '@pasta/config';

const DOMAIN = conf.domain || '';

export default app => {
  app.post('/login/anonymous', wrap(async (req, res) => {
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

  app.post('/login/facebook', wrap(async (req, res) => {
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
      fb: profile.id,
    }).exec();

    if (!user) {
      const pictureUrl = profile.picture.data.url;
      const { headers } = await new Promise<{ headers: any }>((resolve, reject) => {
        request.head(pictureUrl, (err, res) => err ? reject(err) : resolve(res));
      });

      const stdout = await new Promise((resolve, reject) => {
        gm(request(pictureUrl) as any)
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
        fb: profile.id,
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

  app.post('/logout', wrap(async (req, res) => {
    res.clearCookie('tt', {
      domain: DOMAIN,
    }).send();
  }));

  app.get('/users/:id', ejwt({
    secret: conf.jwtSecret,
  }), wrap(async (req, res) => {
    if (req.user.id !== req.params.id) {
      return res.sendStatus(401);
    }
    const user = await User.findById(req.user.id).exec();
    return res.send(user);
  }));

  app.get('/me', ejwt({
    secret: conf.jwtSecret,
    getToken: req => req.cookies.tt,
  }), wrap(async (req, res) => {
    const user = await User.findById(req.user.id).exec();
    return res.send(user);
  }));
};
