export default __CLIENT__ ? (() => {
  const execute = window['execScript'] || (data => window['eval'].call(window, data));

  // Blockly loader script registers global bjects with 'var' syntax,
  // so we have to explicitly set global properties again
  execute(`${require('raw!../../vendor/blockly/blockly_compressed.js')};${[
    'goog',
    'Blockly',
  ].map(varName => `window.${varName}=${varName}`)}`);

  require('script!../../vendor/blockly/blocks_compressed.js');
  require('script!../../vendor/blockly/javascript_compressed.js');
  require('script!../../vendor/blockly/msg/js/en.js');

  return window['Blockly'];
})() : null;
