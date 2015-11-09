// nodemon does not work with babel-node command, so use this entry file
require('babel-core/register');
require('./server');
