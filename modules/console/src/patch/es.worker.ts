// Fix TypeScript - Babel interop rule conflict problem.
// Remove this as soon as this issue is resolved: 
// https://github.com/TypeStrong/ts-loader/issues/111

require('bluebird').__esModule = true;
require('@pasta/game-class').__esModule = true;
require('@pasta/game-class/lib/GameObject').__esModule = true;
require('@pasta/game-class/lib/GameStore').__esModule = true;
