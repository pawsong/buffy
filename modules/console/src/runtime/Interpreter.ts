let _Interpreter = null;

if (__CLIENT__) {
  // JS-Interpreter does not have 'package.json' file, so use relative path
  window['acorn'] = require('../../vendor/JS-Interpreter/acorn');
  require('script!../../vendor/JS-Interpreter/interpreter');

  _Interpreter = window['Interpreter'];
}

export default _Interpreter;
