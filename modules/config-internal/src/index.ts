declare const process;

/**
 * Console server port
 */
export const consolePort: number = 9000;

export const consoleWebpackAppPort: number = 9001;

export const consoleWebpackWorkerPort: number = 9002;

export const compilerPort: number = 9100;

export const gameServerPort: number = 9200;

export const apiServerPort: number = 9300;

export const adminServerPort: number = 9400;

export const compilerUrl: string =
  process.env.PASTA_COMPILER_URL || `http://localhost:${compilerPort}`

export const mongoUri: string = process.env.PASTA_MONGO_URI;

export const s3Bucket: string = process.env.PASTA_S3_BUCKET;

export const awsAccessKeyId: string = process.env.PASTA_AWS_ACCESS_KEY_ID;

export const awsSecretKey: string = process.env.PASTA_AWS_SECRET_KEY;

export const jwtSecret: string = process.env.PASTA_JWT_SECRET;
