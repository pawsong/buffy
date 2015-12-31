const iConfig = module.exports;

iConfig.consolePort = 9000;

iConfig.consoleWebpackAppPort = 9001;

iConfig.consoleWebpackWorkerPort = 9002;

iConfig.compilerPort = 9100;

iConfig.gameServerPort = 9200;

iConfig.apiServerPort = 9300;

iConfig.adminServerPort = 9400;

iConfig.compilerUrl =
  process.env.PASTA_COMPILER_URL || `http://localhost:${iConfig.compilerPort}`

iConfig.mongoUri = process.env.PASTA_MONGO_URI;

iConfig.s3Bucket = process.env.PASTA_S3_BUCKET;

iConfig.awsAccessKeyId = process.env.PASTA_AWS_ACCESS_KEY_ID;

iConfig.awsSecretKey = process.env.PASTA_AWS_SECRET_KEY;

iConfig.jwtSecret = process.env.PASTA_JWT_SECRET;
