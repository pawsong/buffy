import * as gm from 'gm';
import * as shortid from 'shortid';
import * as request from 'request';
import wrap from '@pasta/helper/lib/wrap';
import User from '../../models/User';
import s3 from '../../s3';
import * as jwt from 'jsonwebtoken';
import * as axios from 'axios';
import * as conf from '@pasta/config';

export const checkIfEmailExists = wrap(async (req, res) => {
  const { email } = req.params;
  if (!email) return res.send(400);

  const user = await User.findOne({ email }, { _id: true });
  return res.send({ result: !!user });
});

export const signupWithLocal = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.send(400);
  }

  const user = new User({
    email,
    password,
  });

  await user.save();
  res.send(user);
});

export const loginWithLocal = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.sendStatus(400);

  const user = await User.findOne({ email }).exec();
  if (!user) {
    console.log(`Cannot find user ${email}`);
    return res.sendStatus(400);
  }

  if (!user.authenticate(password)) {
    console.log(`User ${email} authentication failed`);
    return res.sendStatus(400);
  }

  const token = jwt.sign({
    id: user._id,
  }, conf.jwtSecret, {});

  res.cookie('tt' /* tiat token */, token, {
    domain: __DOMAIN__,
    httpOnly: true,
    maxAge: 2592000000, // 1 Month
  });

  res.send(user);
});

export const loginWithFacebook = wrap(async (req, res) => {
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
    return res.sendStatus(401);
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
  }, conf.jwtSecret, {});

  res.cookie('tt' /* tiat token */, token, {
    domain: __DOMAIN__,
    httpOnly: true,
    maxAge: 2592000000, // 1 Month
  });

  res.send(user);
});

export const logout = wrap(async (req, res) => {
  res.clearCookie('tt', { domain: __DOMAIN__ });
  res.sendStatus(200);
});
