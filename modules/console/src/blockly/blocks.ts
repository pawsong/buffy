import Blockly from './';

function nonnegativeNumberValidator(text) {
  let n = Blockly.FieldTextInput.numberValidator(text);
  if (n) {
    n = String(Math.max(0, n));
  }
  return n;
}

/**
 * whenRun block
 */

Blockly.Blocks['when_run'] = {
  // Block to handle event where mouse is clicked
  helpUrl: '',
  init: function () {
    this.setColour(160);
    this.appendDummyInput().appendField('when run');
    this.setPreviousStatement(false);
    this.setNextStatement(true);
  },
  shouldBeGrayedOut: () => false,
};

Blockly.JavaScript['when_run'] = () => '\n';

/**
 * boom block
 */

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

Blockly.Blocks['wait'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('wait for')
      .appendField(new Blockly.FieldTextInput('10', nonnegativeNumberValidator), 'SECS')
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

Blockly.Blocks['move'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('move forward by')
      .appendField(new Blockly.FieldTextInput('3', nonnegativeNumberValidator), 'DISTANCE')
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

Blockly.Blocks['turn'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField('turn')
      .appendField(new Blockly.FieldDropdown([['right', 'RIGHT'], ['left', 'LEFT']]), 'DIRECTION')
      .appendField('by')
      .appendField(new Blockly.FieldTextInput('90', nonnegativeNumberValidator), 'ANGLE')
      .appendField('degree(s)');
    this.setTooltip('turn');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['turn'] = block => {
  const direction = block.getFieldValue('DIRECTION') === 'LEFT' ? '1' : '-1';
  return `window.rotate(${direction} * ${block.getFieldValue('ANGLE')});\n`;
};

/**
 * floor color sensor block
 */

Blockly.Blocks['color_sensor_center'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField('center floor color')
    this.setOutput(true, 'Number');
    this.setTooltip('Returns floor color');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['color_sensor_center'] = block => {
  return [`window.getFloorColor(0, 0)`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.Blocks['color_sensor_front_left'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField('front-left floor color')
    this.setOutput(true, 'Number');
    this.setTooltip('Returns floor color');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['color_sensor_front_left'] = block => {
  return [`window.getFloorColor(2/16, -2/16)`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.Blocks['color_sensor_front_right'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField('front-right floor color')
    this.setOutput(true, 'Number');
    this.setTooltip('Returns floor color');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['color_sensor_front_right'] = block => {
  return [`window.getFloorColor(2/16, 2/16)`, Blockly.JavaScript.ORDER_NONE];
};
