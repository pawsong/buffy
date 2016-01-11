declare const process;

/**
 * Console server port
 */
export const consolePort: number = 9000;

/**
 * Port of console webpack dev server for app
 */
export const consoleDevPort: number = 9001;

/**
 * Compiler server port
 */
export const compilerPort: number = 9100;

/**
 * Game zone server port
 */
export const gameServerPort: number = 9200;

/**
 * API server port
 */
export const apiServerPort: number = 9300;

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
