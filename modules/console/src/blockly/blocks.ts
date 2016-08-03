import {cyanA700, blueGrey200, pink300, greenA700} from 'material-ui/styles/colors';

import Blockly from './';
import { Keys } from './constants';

function nonnegativeNumberValidator(text) {
  let n = Blockly.FieldTextInput.numberValidator(text);
  if (n) {
    n = String(Math.max(0, n));
  }
  return n;
}

const METER_SCALE = 4;

/* Styling */
Blockly.Blocks.math.HUE = blueGrey200;
Blockly.Blocks.loops.HUE = greenA700;

/**
 * whenRun block
 */

Blockly.Blocks['when_run'] = {
  // Block to handle event where mouse is clicked
  helpUrl: '',
  init: function () {
    this.setColour(pink300);
    this.appendDummyInput().appendField('when run');
    this.setPreviousStatement(false);
    this.setNextStatement(true);
  },
  shouldBeGrayedOut: () => false,
};

Blockly.JavaScript['when_run'] = () => '\n';

/**
 * move block
 */

Blockly.Blocks['move'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
        .appendField('move')
        .appendField(new Blockly.FieldDropdown([
          ['forward', 'FORWARD'],
          ['back', 'BACK'],
          ['up', 'UP'],
          ['down', 'DOWN'],
          ['left', 'LEFT'],
          ['right', 'RIGHT'],
        ]), 'DIRECTION')

    this.appendValueInput('DISTANCE')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('by (meters)');

    this.appendValueInput('DURATION')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('for (seconds)');

    this.setTooltip('move');
    // this.setHelpUrl('http://www.example.com');
  }
};

const DIRECTIONS = {
  'FORWARD': '[0, 0, 1]',
  'BACK': '[0, 0, -1]',
  'UP': '[0, 1, 0]',
  'DOWN': '[0, -1, 0]',
  'LEFT': '[1, 0, 0]',
  'RIGHT': '[-1, 0, 0]',
};

Blockly.JavaScript['move'] = block => {
  const direction = DIRECTIONS[block.getFieldValue('DIRECTION')];

  let distance: string;
  if (!(distance = Blockly.JavaScript.valueToCode(block, 'DISTANCE', Blockly.JavaScript.ORDER_ADDITION))) {
    return '';
  }

  let duration: string;
  if (!(duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ADDITION))) {
    return '';
  }

  return `window.moveLocal(${duration} * 1000, ${direction}, ${distance} * ${METER_SCALE});\n`;
};

/**
 * jump block
 */

Blockly.Blocks['jump'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendValueInput('HEIGHT')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('jump by (meters)')

    this.appendValueInput('DURATION')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('for (seconds)');

    this.setTooltip('jump');
    // this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['jump'] = block => {
  let height: string;
  if (!(height = Blockly.JavaScript.valueToCode(block, 'HEIGHT', Blockly.JavaScript.ORDER_ADDITION))) {
    return '';
  }

  let duration: string;
  if (!(duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ADDITION))) {
    return '';
  }

  return `window.jump(${duration} * 1000, ${height} * ${METER_SCALE});\n`;
};

/**
 * on_keydown block
 */

const keys = Keys.map(key => {
  return [key.label, key.id];
});

Blockly.Blocks['on_keydown'] = {
  // Block to handle event where mouse is clicked
  helpUrl: '',
  init: function () {
    const dropdown = new Blockly.FieldDropdown(keys);

    this.setColour(160);
    this.appendDummyInput()
      .appendField('on')
      .appendField(dropdown, 'KEY')
      .appendField('key down');
    this.setPreviousStatement(false);
    this.setNextStatement(true);
  },
  shouldBeGrayedOut: () => false,
};

Blockly.JavaScript['on_keydown'] = () => '\n';

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
 * scaleX block
 */

Blockly.Blocks['scaleX'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
      .appendField('scale X by')
      .appendField(new Blockly.FieldTextInput('3', nonnegativeNumberValidator), 'VALUE')
      .appendField('times')
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldTextInput('1', nonnegativeNumberValidator), 'DURATION')
      .appendField('sec(s)');

    this.setTooltip('move');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['scaleX'] = block => {
  const duration = block.getFieldValue('DURATION') * 1000;
  const value = block.getFieldValue('VALUE');

  return `window.scaleX(${duration}, ${value});\n`;
};

/**
 * scaleY block
 */

Blockly.Blocks['scaleY'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
      .appendField('scale Y by')
      .appendField(new Blockly.FieldTextInput('3', nonnegativeNumberValidator), 'VALUE')
      .appendField('times')
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldTextInput('1', nonnegativeNumberValidator), 'DURATION')
      .appendField('sec(s)');

    this.setTooltip('move');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['scaleY'] = block => {
  const duration = block.getFieldValue('DURATION') * 1000;
  const value = block.getFieldValue('VALUE');

  return `window.scaleY(${duration}, ${value});\n`;
};

/**
 * scaleZ block
 */

Blockly.Blocks['scaleZ'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
      .appendField('scale Z by')
      .appendField(new Blockly.FieldTextInput('3', nonnegativeNumberValidator), 'VALUE')
      .appendField('times')
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldTextInput('1', nonnegativeNumberValidator), 'DURATION')
      .appendField('sec(s)');

    this.setTooltip('move');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['scaleZ'] = block => {
  const duration = block.getFieldValue('DURATION') * 1000;
  const value = block.getFieldValue('VALUE');

  return `window.scaleZ(${duration}, ${value});\n`;
};

/**
 * rotate block
 */

Blockly.Blocks['rotate'] = {
  init: function() {
    this.setColour(160);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
      .appendField('rotate by')
      .appendField(new Blockly.FieldTextInput('3', nonnegativeNumberValidator), 'VALUE')
      .appendField('degree(s)')
    this.appendDummyInput()
      .appendField('for')
      .appendField(new Blockly.FieldTextInput('1', nonnegativeNumberValidator), 'DURATION')
      .appendField('sec(s)');

    this.setTooltip('move');
    this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['rotate'] = block => {
  const duration = block.getFieldValue('DURATION') * 1000;
  const value = block.getFieldValue('VALUE');

  return `window.rotateLeft(${duration}, ${value});\n`;
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

    this.appendStatementInput('DO')
      .appendField('and');

    this.appendStatementInput('DO2')
      .appendField('and');

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

/**
 * concurrently block
 */

Blockly.Blocks['concurrently'] = {
  /**
   * Block for if/elseif/else condition.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.CONTROLS_IF_HELPURL);
    this.setColour(Blockly.Blocks.logic.HUE);

    this.appendDummyInput()
        .appendField('concurrently' /* Blockly.Msg.CONTROLS_IF_IF_TITLE_IF */);

    this.appendStatementInput('DO_A')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
    this.appendStatementInput('DO_B')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setMutator(new Blockly.Mutator(['concurrently_do']));

    this.setTooltip(() => {
      if (!this.additionalDoCount_) {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_1;
      } else {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_3;
      }
    });
    this.additionalDoCount_ = 0;
  },
  /**
   * Create XML to represent the number of else-if and else inputs.
   * @return {Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function() {
    if (!this.additionalDoCount_) return null;

    const container = document.createElement('mutation');
    if (this.additionalDoCount_) {
      container.setAttribute('do', this.additionalDoCount_);
    }
    return container;
  },
  /**
   * Parse XML to restore the else-if and else inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function(xmlElement) {
    this.additionalDoCount_ = parseInt(xmlElement.getAttribute('do'), 10) || 0;
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function(workspace) {
    const containerBlock = workspace.newBlock('concurrently_root');
    containerBlock.initSvg();

    let connection = containerBlock.nextConnection;
    for (let i = 1; i <= this.additionalDoCount_; i++) {
      const doBlock = workspace.newBlock('concurrently_do');
      doBlock.initSvg();
      connection.connect(doBlock.previousConnection);
      connection = doBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function(containerBlock) {
    let clauseBlock = containerBlock.nextConnection.targetBlock();

    // Count number of inputs.
    this.additionalDoCount_ = 0;

    const statementConnections = [null];

    while (clauseBlock) {
      switch (clauseBlock.type) {
        case 'concurrently_do': {
          this.additionalDoCount_++;
          statementConnections.push(clauseBlock.statementConnection_);
          break;
        }
        default:
          throw 'Unknown block type.';
      }
      clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
    }

    this.updateShape_();

    // Reconnect any child blocks.
    for (let i = 1; i <= this.additionalDoCount_; i++) {
      Blockly.Mutator.reconnect(statementConnections[i], this, 'DO' + i);
    }
  },

  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function(containerBlock) {
    let clauseBlock = containerBlock.nextConnection.targetBlock();
    let i = 1;
    while (clauseBlock) {
      switch (clauseBlock.type) {
        case 'concurrently_do': {
          const inputDo = this.getInput('DO' + i);
          clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
          i++;
          break;
        }
        default:
          throw 'Unknown block type.';
      }
      clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
    }
  },

  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function() {
    // Delete everything.
    for (let i = 1; this.getInput('DO' + i); ++i) {
      this.removeInput('DO' + i);
    }

    // Rebuild block.
    for (let i = 1; i <= this.additionalDoCount_; i++) {
      this.appendStatementInput('DO' + i)
          .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
    }
  }
};

Blockly.Blocks['concurrently_root'] = {
  /**
   * Mutator block for if container.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(Blockly.Blocks.logic.HUE);
    this.appendDummyInput()
        .appendField('concurrently' /* Blockly.Msg.CONTROLS_IF_IF_TITLE_IF */);
    this.setNextStatement(true);
    // this.setTooltip(Blockly.Msg.CONTROLS_IF_IF_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['concurrently_do'] = {
  /**
   * Mutator bolck for else-if condition.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(Blockly.Blocks.logic.HUE);
    this.appendDummyInput()
        .appendField('do' /* Blockly.Msg.CONTROLS_IF_ELSEIF_TITLE_ELSEIF */);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    // this.setTooltip(Blockly.Msg.CONTROLS_IF_ELSEIF_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.JavaScript['concurrently'] = function(block) {
  const scripts = [
    Blockly.JavaScript.statementToCode(block, 'DO_A'),
    Blockly.JavaScript.statementToCode(block, 'DO_B'),
  ];

  for (let i = 1; i <= block.additionalDoCount_; ++i) {
    scripts.push(Blockly.JavaScript.statementToCode(block, 'DO' + i));
  }

  const result = scripts.filter(text => text).map(text => JSON.stringify(text));
  return `window.runConcurrently([${result.join(',')}]);\n`;
};
