import * as iConfig from '@pasta/config-internal';
import * as AWS from 'aws-sdk';

export default new AWS.S3({
  accessKeyId: iConfig.awsAccessKeyId,
  secretAccessKey: iConfig.awsSecretKey,
  region: 'ap-northeast-1',
}) as any;
