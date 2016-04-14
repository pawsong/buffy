declare const process;

(isNode => {
  if (isNode) { return; }
  throw new Error('Config must be used by node process');
})(
  typeof process === 'object' &&
  Object.prototype.toString.call(process) === '[object process]'
);

export const domain = 'buffy.run';

/**
 * Console server port
 */
export const consolePort: number = 9000;

/**
 * Port of console webpack dev server for app
 */
export const consoleDevPort: number = 9001;

export const consoleClientPort: number = 9002;

export const consolePublicPath: string = 'https://dut3rr7qk867n.cloudfront.net';

export const addonConsoleClientPort = 9002;

/**
 * Game zone server port
 */
export const gameServerPort: number = 9200;

/**
 * Game zone server public url
 */
export const gameServerUrl = `http://zone.${domain}`;

/**
 * API server port
 */

export const apiServerPort: number = 9300;

export const apiServerUrl = `http://api.${domain}`;

export const addonVoxelEditorServerPort: number = 9300;

export const addonVoxelEditorServerUrl = `http://api.${domain}`;

export const addonVoxelEditorClientPort: number = 9301;

export const addonCodeEditorServerPort: number = 9600;

export const addonCodeEditorServerUrl = `http://code.${domain}`;

export const addonCodeEditorClientPort: number = 9601;

export const addonCodeEditorWorkerPort: number = 9602;

export const addonGameServerPort = 9700;

export const addonGameClientPort: number = 9701;

/**
 * Admin server port
 */
export const adminServerPort: number = 9400;

export const devServerPort = 9401;

/**
 * Port of console webpack dev server for app
 */
export const adminWebpackAppPort: number = 9401;

/**
 * Admin server frontend browser-sync port
 */
export const adminServerDevPort: number = 9402;

/**
* public path for admin server assets
*/
export const adminPublicPath: string = 'https://dut3rr7qk867n.cloudfront.net';

/**
 * mongodb server url
 */
export const mongoUri: string = process.env.PASTA_MONGO_URI;

/**
 * aws s3 bucket name
 */
export const s3Bucket: string = process.env.PASTA_S3_BUCKET;

/**
 * aws s3 bucket region
 */
export const awsS3Region: string = process.env.PASTA_AWS_S3_REGION;

/**
 * aws access key id
 */
export const awsAccessKeyId: string = process.env.PASTA_AWS_ACCESS_KEY_ID;

/**
 * aws secret key
 */
export const awsSecretKey: string = process.env.PASTA_AWS_SECRET_KEY;

/**
 * jwt secret for authentication
 */
export const jwtSecret: string = process.env.PASTA_JWT_SECRET;

export const facebookAppIdDev: string = '1127122043982378';

export const facebookAppIdProd: string = '1127121857315730';
