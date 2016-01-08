// Fix TypeScript - Babel interop rule conflict problem.
// Remove this as soon as this issue is resolved: 
// https://github.com/TypeStrong/ts-loader/issues/111

require('bluebird').__esModule = true;
require('express').__esModule = true;
require('cookie-parser').__esModule = true;
require('express-jwt').__esModule = true;
