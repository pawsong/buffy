import * as gm from 'gm';
import * as shortid from 'shortid';
import * as request from 'request';
import wrap from '@pasta/helper/lib/wrap';
import s3 from '../../s3';
import User, { UserDocument } from '../../models/User';
import * as jwt from 'jsonwebtoken';
import * as axios from 'axios';
import * as conf from '@pasta/config';

import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';

const EXPIRES = 60;

export const issueS3SignedUrlForProfile = compose(requiresLogin, wrap(async (req, res) => {
  const user: UserDocument = req['userDoc'];
  const { contentType } = req.body;

  const params = {
    Bucket: conf.s3Bucket,
    Key: `profiles/${user.id}/${shortid.generate()}`,
    ACL: 'public-read',
    Expires: EXPIRES,
    ContentType: contentType,
  };

  const signedUrl = await new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => err ? reject(err) :resolve(url));
  });

  return res.send({ signedUrl });
}));
