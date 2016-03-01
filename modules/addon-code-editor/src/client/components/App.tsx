import * as React from 'react';

import * as shortid from 'shortid';

import { EventEmitter, EventSubscription } from 'fbemitter';

import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import { Blockly, Interpreter } from '../blockly';
import * as Scope from '../blockly/scope';

import * as StorageKeys from '../constants/StorageKeys';

const toolbox = require('raw!../blockly/toolbox.xml');
const initBlock = require('raw!../blockly/initBlock.xml');

const styles = {
  editor: {
    position: 'absolute',
    margin: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
};

interface AppProps extends React.Props<App> {
  addonEmitter: EventEmitter;
  stateLayer?: StateLayer;
}

@connectStateLayer()
class App extends React.Component<AppProps, {}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'App';

  workspace: any;
  runningProcessId = '';

  resizeToken: EventSubscription;
  runToken: EventSubscription;

  componentDidMount() {
    // Blockly
    this.workspace = Blockly.inject(this.refs['editor'], {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      trashcan: true,
    });

    Blockly.JavaScript.init(this.workspace);

    const savedXml = localStorage.getItem(StorageKeys.BLOCKLY_WORKSPACE);
    const initDom = Blockly.Xml.textToDom(savedXml || initBlock);
    Blockly.Xml.domToWorkspace(this.workspace, initDom);

    this.workspace.addChangeListener((e) => {
      const dom = Blockly.Xml.workspaceToDom(this.workspace);
      const xml = Blockly.Xml.domToText(dom);
      localStorage.setItem(StorageKeys.BLOCKLY_WORKSPACE, xml);
    });

    this.resizeToken = this.props.addonEmitter.addListener('resize', () => Blockly.svgResize(this.workspace));
    this.runToken = this.props.addonEmitter.addListener('run', () => this.handleRun());
  }

  componentWillUnmount() {
    this.resizeToken.remove();
    this.runToken.remove();

    this.destroyProcess();
    this.workspace.dispose();
  }

  destroyProcess() {
    this.runningProcessId = '';

    // TODO: Ensure all running threads are terminated
    // TODO: Remove event listeners
  }

  handleRun() {
    this.destroyProcess();

    const processId = this.runningProcessId = shortid.generate();

    this.workspace.getTopBlocks().forEach(block => {
      // TODO: Check top block is an event emitter
      if (block.type === 'when_run') {
        const code = Blockly.JavaScript.blockToCode(block);

        const interpreter = new Interpreter(code, (instance, scope) => Scope.inject(instance, scope, {
          stateLayer: this.props.stateLayer,
          interpreter: instance,
        }, () => nextStep()));

        const nextStep = () => {
          // Do not step when process is not running
          if (processId !== this.runningProcessId) { return; }
          if (!interpreter.step()) { return; }
          if (interpreter.paused_) {
            // Response will resume this interpreter
            return;
          }

          // TODO: Support detailed speed setting
          // TODO: Prevent halting vm on infinite loop
          nextStep();
          // setTimeout(nextStep, 0);
        };
        nextStep();
      }
    });
  }

  render() {
    return <div>
      <div ref="editor" style={styles.editor}></div>
    </div>;
  };
}

export default App;
