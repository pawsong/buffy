// Fix TypeScript - Babel interop rule conflict problem.
// Remove this as soon as this issue is resolved: 
// https://github.com/TypeStrong/ts-loader/issues/111

require('bluebird').__esModule = true;
require('express').__esModule = true;
require('cookie-parser').__esModule = true;
require('express-jwt').__esModule = true;
require('@pasta/config-public').__esModule = true;
require('@pasta/config-internal').__esModule = true;
require('@pasta/game-class').__esModule = true;
require('@pasta/game-class/lib/GameObject').__esModule = true;
require('@pasta/game-class/lib/GameStore').__esModule = true;
require('@pasta/mongodb').__esModule = true;
require('@pasta/mongodb/lib/models/User').__esModule = true;
require('@pasta/mongodb/lib/models/Script').__esModule = true;
require('@pasta/mongodb/lib/models/Terrain').__esModule = true;
require('@pasta/mongodb/lib/models/VoxelWorkspace').__esModule = true;
