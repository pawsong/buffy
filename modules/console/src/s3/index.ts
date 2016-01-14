import * as iconf from '@pasta/config';
import * as AWS from 'aws-sdk';

export default new AWS.S3({
  accessKeyId: iconf.awsAccessKeyId,
  secretAccessKey: iconf.awsSecretKey,
  region: iconf.awsS3Region,
  signatureVersion: 'v4',
}) as any;
