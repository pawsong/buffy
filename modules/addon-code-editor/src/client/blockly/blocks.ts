import { Blockly } from './index';
import * as Scope from './scope';

Scope.register('alert', ({
  stateLayer,
  interpreter,
}) => text => {
  const msg = text ? text.toString() : '';
  return interpreter.createPrimitive(alert(msg));
});

/**
 * whenRun block
 */

Blockly.Blocks['when_run'] = {
  // Block to handle event where mouse is clicked
  helpUrl: '',
  init: function () {
    this.setColour(160);
    this.appendDummyInput().appendTitle('when run');
    this.setPreviousStatement(false);
    this.setNextStatement(true);
  },
  shouldBeGrayedOut: () => false,
};

Blockly.JavaScript['when_run'] = () => '\n';

/**
 * boom block
 */

Scope.registerAsync('boom', ({
  stateLayer,
}) => () => {
  const { position } = stateLayer.store.getPlayer();
  stateLayer.rpc.playEffect({
    x: position.x,
    z: position.z,
    duration: 2,
  });
  return Promise.resolve();
});

Blockly.Blocks['boom'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
        .appendField('boom');
    this.setTooltip('Play boom effect.');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['boom'] = block => {
  return 'window.boom();\n';
};

/**
 * wait block
 */

Scope.registerAsync('wait', () => (secs) => new Promise(resolve => setTimeout(resolve, secs * 1000)));

Blockly.Blocks['wait'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('wait for')
      .appendField(new Blockly.FieldTextInput('10', Blockly.FieldTextInput.nonnegativeIntegerValidator), 'SECS')
      .appendField('seconds')
    this.setTooltip('wait for seconds');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['wait'] = block => {
  return `window.wait(${block.getFieldValue('SECS')});\n`;
};
