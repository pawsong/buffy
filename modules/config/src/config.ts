declare const process;

(isNode => {
  if (isNode) { return; }
  throw new Error('Config must be used by node process');
})(
  typeof process === 'object' &&
  Object.prototype.toString.call(process) === '[object process]'
);

/**
 * Console server port
 */
export const consolePort: number = 9000;

/**
 * Port of console webpack dev server for app
 */
export const consoleDevPort: number = 9001;

export const consolePublicPath: string = 'https://dut3rr7qk867n.cloudfront.net';

/**
 * Compiler server port
 */
export const compilerPort: number = 9100;

/**
 * Game zone server port
 */
export const gameServerPort: number = 9200;

/**
 * Game zone server public url
 */
export const gameServerUrl = 'http://zone.project-pasta.io';

/**
 * API server port
 */
export const addonVoxelEditorServerPort: number = 9300;

export const addonVoxelEditorServerUrl = `http://api.project-pasta.io`;

export const addonCodeEditorServerPort: number = 9600;

export const addonCodeEditorServerUrl = `http://code.project-pasta.io`;

/**
 * Admin server port
 */
export const adminServerPort: number = 9400;

/**
 * Port of console webpack dev server for app
 */
export const adminWebpackAppPort: number = 9401;

/**
 * Admin server frontend browser-sync port
 */
export const adminServerDevPort: number = 9402;

export const authServerPort = 9500;

export const authServerUrl = 'http://auth.project-pasta.io';

/**
* public path for admin server assets
*/
export const adminPublicPath: string = 'https://dut3rr7qk867n.cloudfront.net';

/**
 * Compiler server url
 */
export const compilerUrl: string =
  process.env.PASTA_COMPILER_URL || `http://localhost:${compilerPort}`

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

export const domain = process.env.PASTA_DOMAIN;

export const facebookAppIdDev: string = '1127122043982378';

export const facebookAppIdProd: string = '1127121857315730';
