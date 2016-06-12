import * as shortid from 'shortid';
import * as request from 'request';
import wrap from '@pasta/helper/lib/wrap';
import { getSignedUrlForPutObject } from '../../s3';
import User, { UserDocument } from '../../models/User';
import * as jwt from 'jsonwebtoken';
import * as conf from '@pasta/config';

import { compose } from 'compose-middleware/lib';
import { requiresLogin } from '../../middlewares/auth';

const EXPIRES = 60;

export const issueS3SignedUrlForProfile = compose(requiresLogin, wrap(async (req, res) => {
  const user: UserDocument = req['userDoc'];
  const { contentType } = req.body;

  const key = `profiles/${user.id}/${shortid.generate()}`;

  const params = {
    contentType,
    cacheControl: 'public,max-age=31536000',
  };

  const signedUrl = await getSignedUrlForPutObject(key, params);

  return res.send({ key, signedUrl, cacheControl: params.cacheControl });
}));
