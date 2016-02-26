const execute = window['execScript'] || (data => window['eval'].call(window, data));

// Blockly loader script registers global bjects with 'var' syntax,
// so we have to explicitly set global properties again
execute(`${require('raw!../../../externals/blockly/blockly_compressed.js')};${[
  'goog',
  'Blockly',
].map(varName => `window.${varName}=${varName}`)}`);

require('script!../../../externals/blockly/blocks_compressed.js');
require('script!../../../externals/blockly/javascript_compressed.js');
require('script!../../../externals/blockly/msg/js/en.js');

const Blockly = window['Blockly'];
export { Blockly };

// JS-Interpreter does not have 'package.json' file, so use relative path
if (process.env.NODE_ENV === 'development') {
  window['acorn'] = require('../../../externals/JS-Interpreter/acorn');
  require('script!../../../externals/JS-Interpreter/interpreter');
} else {
  require('script!../../../externals/JS-Interpreter/acorn_interpreter');
}

const Interpreter = window['Interpreter'];
export { Interpreter };
