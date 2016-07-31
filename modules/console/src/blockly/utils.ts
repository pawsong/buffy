import { Scripts } from '@pasta/core/lib/types';
import Blockly from './';
import { Keys, Key } from './constants';

const indexedKeys: { [index: string]: Key } = {};
Keys.forEach(key => indexedKeys[key.id] = key);

export function compileBlocklyXml(workspace: any): Scripts {
  const scripts: Scripts = {};

  workspace.getTopBlocks().forEach(block => {
    let event;

    switch(block.type) {
      case 'when_start': {
        event = 'when_start';
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

  return scripts;
}
