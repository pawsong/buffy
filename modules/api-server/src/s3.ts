import * as conf from '@pasta/config';
import * as AWS from 'aws-sdk';

const EXPIRES = 60;

const s3 = new AWS.S3({
  accessKeyId: conf.awsAccessKeyId,
  secretAccessKey: conf.awsSecretKey,
  region: conf.awsS3Region,
  signatureVersion: 'v4',
}) as any;

interface PutObjectParams {
  contentType: string;
  cacheControl: string;
}

export async function getSignedUrlForPutObject(key: string, params: PutObjectParams) {
  return await new Promise<string>((resolve, reject) => {
    s3.getSignedUrl('putObject', {
      Bucket: conf.s3Bucket,
      Key: key,
      ACL: 'public-read',
      Expires: EXPIRES,
      ContentType: params.contentType,
      CacheControl: params.cacheControl,
    }, (err, url) => err ? reject(err) : resolve(url));
  });
}

export default s3;
