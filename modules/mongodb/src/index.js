export const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

export const User = require('./models/User');
export const Terrain = require('./models/Terrain');
export const Script = require('./models/Script');
export const VoxelWorkspace = require('./models/VoxelWorkspace');
