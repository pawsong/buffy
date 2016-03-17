import * as Scope from './scope';

let _Blockly;
let _Interpreter;

if (__CLIENT__) {
  const execute = window['execScript'] || (data => window['eval'].call(window, data));

  // Blockly loader script registers global bjects with 'var' syntax,
  // so we have to explicitly set global properties again
  execute(`${require('raw!../../../../../../externals/blockly/blockly_compressed.js')};${[
    'goog',
    'Blockly',
  ].map(varName => `window.${varName}=${varName}`)}`);

  require('script!../../../../../../externals/blockly/blocks_compressed.js');
  require('script!../../../../../../externals/blockly/javascript_compressed.js');
  require('script!../../../../../../externals/blockly/msg/js/en.js');

  _Blockly = window['Blockly'];

  // JS-Interpreter does not have 'package.json' file, so use relative path
  window['acorn'] = require('../../../../../../externals/JS-Interpreter/acorn');
  require('script!../../../../../../externals/JS-Interpreter/interpreter');

  _Interpreter = window['Interpreter'];
}

const Blockly = _Blockly;
const Interpreter = _Interpreter;

export {
  Blockly,
  Interpreter,
  Scope,
};
