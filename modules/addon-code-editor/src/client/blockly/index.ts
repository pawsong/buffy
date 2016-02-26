const execute = window['execScript'] || (data => window['eval'].call(window, data));

// Blockly loader script registers global bjects with 'var' syntax,
// so we have to explicitly set global properties again
execute(`${require('raw!blockly/blockly_compressed.js')};${[
  'goog',
  'Blockly',
].map(varName => `window.${varName}=${varName}`)}`);

require('script!blockly/blocks_compressed.js');
require('script!blockly/javascript_compressed.js');
require('script!blockly/msg/js/en.js');

const Blockly = window['Blockly'];
export { Blockly };

// JS-Interpreter does not have 'package.json' file, so use relative path
if (process.env.NODE_ENV === 'development') {
  window['acorn'] = require('../../../../JS-Interpreter/acorn');
  require('script!../../../../JS-Interpreter/interpreter');
} else {
  require('script!../../../../JS-Interpreter/acorn_interpreter');
}

const Interpreter = window['Interpreter'];
export { Interpreter };
