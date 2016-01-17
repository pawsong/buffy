import * as conf from '@pasta/config';
import * as AWS from 'aws-sdk';

export default new AWS.S3({
  accessKeyId: conf.awsAccessKeyId,
  secretAccessKey: conf.awsSecretKey,
  region: conf.awsS3Region,
  signatureVersion: 'v4',
}) as any;
