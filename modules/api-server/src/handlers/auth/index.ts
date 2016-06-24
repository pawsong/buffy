import * as shortid from 'shortid';
import * as request from 'request';
import wrap from '@pasta/helper/lib/wrap';
import validatePassword, {
  ValidationResult as PasswordValidateResult,
} from '@pasta/helper/lib/validatePassword';
import User, { UserDocument } from '../../models/User';
import { getSignedUrlForPutObject } from '../../s3';
import * as jwt from 'jsonwebtoken';
import * as conf from '@pasta/config';
import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';

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

interface GraphApiResult {
  id: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export const loginWithFacebook = wrap(async (req, res) => {
  const fbToken = (req.body || {}).token;

  // Request data with token.
  const profile = await new Promise<GraphApiResult>((resolve, reject) => {
    request.get({
      url: 'https://graph.facebook.com/me',
      qs: { fields: 'id,name,picture.type(large)' },
      headers: {
        Accept: 'application/json',
        Authorization: `OAuth ${fbToken}`
      },
      json: true,
    }, (error, response, body) => {
      if (error) return reject(error);
      return resolve(response.statusCode === 200 ? body : null);
    });
  });

  if (!profile) return res.sendStatus(400);

  let user = await User.findOne({
    fb: profile.id,
  }).exec();

  if (!user) {
    user = new User();

    const pictureUrl = profile.picture.data.url;
    const { headers } = await new Promise<{ headers: any }>((resolve, reject) => {
      request.get(pictureUrl, (err, res) => err ? reject(err) : resolve(res));
    });

    const key = `profiles/${user.id}/${shortid.generate()}`;

    const params = {
      contentType: headers['content-type'],
      cacheControl: 'public,max-age=31536000',
    };

    const signedUrl = await getSignedUrlForPutObject(key, params);

    await new Promise((resolve, reject) => {
      request(pictureUrl)
        .on('response', resp => { delete resp.headers['cache-control'] })
        .pipe(request.put({
          url: signedUrl,
          headers: {
            'Content-Type': params.contentType,
            'Cache-Control': params.cacheControl,
          },
        }))
        .on('response', resp => resp.statusCode === 200 ? resolve() : reject(resp));
    });

    user.fb = profile.id;
    user.picture = key;
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

export const updatePassword = compose(requiresLogin, wrap(async (req, res) => {
  if (!req.body) return res.send(400);
  const { password, newPassword } = req.body;

  if (validatePassword(newPassword) !== PasswordValidateResult.OK) {
    return res.sendStatus(400);
  }

  const user: UserDocument = req['userDoc'];

  if (!user.authenticate(password)) {
    return res.status(403).send('invalid_password');
  }

  user.password = newPassword;
  await user.save();

  res.send(200);
}));
