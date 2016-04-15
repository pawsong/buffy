import { Scripts } from '@pasta/core/lib/Project';
import Blockly from './';

export function convertXmlToCodes(xml: string): Scripts {
  // Create temporary workspace to parse xml string.
  const workspace = new Blockly.Workspace();
  Blockly.JavaScript.init(workspace);
  const dom = Blockly.Xml.textToDom(xml);
  Blockly.Xml.domToWorkspace(dom, workspace);

  // Parse!
  const scripts: Scripts = {};

  workspace.getTopBlocks().forEach(block => {
    // TODO: Check if top block is an event emitter
    if (block.type === 'when_run') {
      if (!scripts[block.type]) scripts[block.type] = [];

      const code = Blockly.JavaScript.blockToCode(block);
      scripts[block.type].push(code);
    }
  });

  workspace.dispose();
  return scripts;
}
