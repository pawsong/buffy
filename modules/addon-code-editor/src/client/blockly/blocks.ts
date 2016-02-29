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

/**
 * move block
 */

Scope.registerAsync('moveForward', ({
  stateLayer,
}) => (distance) => {
  const obj = stateLayer.store.getPlayer();
  const newPos = obj.position.clone().add(obj.direction.clone().multiplyScalar(distance));
  return stateLayer.rpc.move({
    id: obj.id,
    x: newPos.x,
    z: newPos.z,
  });
});

Blockly.Blocks['move'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('move forward by')
      .appendField(new Blockly.FieldTextInput('3', Blockly.FieldTextInput.nonnegativeIntegerValidator), 'DISTANCE')
      .appendField('meter(s)');
    this.setTooltip('move');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['move'] = block => {
  return `window.moveForward(${block.getFieldValue('DISTANCE')});\n`;
};

/**
 * turn block
 */

Scope.registerAsync('rotate', ({
  stateLayer,
}) => (angle) => {
  const obj = stateLayer.store.getPlayer();
  const newDirection = obj.direction.clone().applyAxisAngle({ x: 0, y: 1, z: 0 }, angle / 180 * Math.PI);
  return stateLayer.rpc.rotate({
    id: obj.id,
    direction: newDirection.serialize(),
  });
});

Blockly.Blocks['turn'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('turn')
      .appendField(new Blockly.FieldDropdown([['right', 'RIGHT'], ['left', 'LEFT']]), 'DIRECTION')
      .appendField('by')
      .appendField(new Blockly.FieldTextInput('90', Blockly.FieldTextInput.nonnegativeIntegerValidator), 'ANGLE')
      .appendField('degree(s)');
    this.setTooltip('turn');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['turn'] = block => {
  const direction = block.getFieldValue('DIRECTION') === 'LEFT' ? '1' : '-1';
  return `window.rotate(${direction} * ${block.getFieldValue('ANGLE')});\n`;
};
