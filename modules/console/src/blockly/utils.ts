import { Scripts } from '@pasta/core/lib/types';
import Blockly from './';
import { Keys, Key } from './constants';

const indexedKeys: { [index: string]: Key } = {};
Keys.forEach(key => indexedKeys[key.id] = key);

export function compileBlocklyXml(xml: string): Scripts {
  // Create temporary workspace to parse xml string.
  const workspace = new Blockly.Workspace();
  Blockly.JavaScript.init(workspace);
  const dom = Blockly.Xml.textToDom(xml);
  Blockly.Xml.domToWorkspace(dom, workspace);

  // Parse!
  const scripts: Scripts = {};

  workspace.getTopBlocks().forEach(block => {
    let event;

    switch(block.type) {
      case 'when_run': {
        event = 'when_run';
        break;
      }
      case 'on_keydown': {
        const keyId = block.getFieldValue('KEY');
        const key = indexedKeys[keyId];

        if (!key) break;

        event = `keydown_${key.keyCode}`;
        break;
      }
    }

    if (event) {
      if (!scripts[event]) scripts[event] = [];
      const code = Blockly.JavaScript.blockToCode(block);
      scripts[event].push(code);
    }
  });

  workspace.dispose();
  return scripts;
}
