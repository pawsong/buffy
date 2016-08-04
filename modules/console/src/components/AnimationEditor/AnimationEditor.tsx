import React from 'react';
import { findDOMNode } from 'react-dom';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';

import Sandbox, {SandboxProcess, estimateTime} from '../../Sandbox';

let _TWEEN: typeof TWEEN;

if (__CLIENT__) {
  _TWEEN = require('tween.js');
}

import ModelCanvas from '../../canvas/ModelCanvas';

const styles = require('./AnimationEditor.css');

const toolbox = require('raw!../../blockly/toolbox.xml');
const initBlock: string = require('raw!../../blockly/initBlock.xml');

import LinearProgress from 'material-ui/LinearProgress';

import ProgressBar, { ProgressState } from '../ProgressBar';

import {
  ModelFileState,
} from '../ModelEditor';

import Blockly from '../../blockly';
import { compileBlocklyXml } from '../../blockly/utils';

import { ExtraData } from './types';

let blocklyRoot: HTMLElement;
let defaultWorkspace: any;

if (__CLIENT__) {
  require('../../blockly/blocks');

  blocklyRoot = document.createElement('div');
  document.body.appendChild(blocklyRoot);
  blocklyRoot.style.visibility = 'hidden';

  const container = document.createElement('div');
  blocklyRoot.appendChild(container);
  defaultWorkspace = Blockly.inject(container, { readOnly: true });
  setTimeout(() => blocklyRoot.removeChild(container), 0);
}

interface AnimationEditorProps {
  fileState: ModelFileState;
  extraData: ExtraData;
  sizeVersion: number;
  onUpdate: () => any;
}

interface AnimationEditorState {
  progress?: ProgressState;
  estimatedTime?: number;
}

function estimateWorkspaceTime(workspace: any) {
  const result = compileBlocklyXml(workspace);
  if (!result['when_run']) return 0;

  return result['when_run']
    .map(code => estimateTime(code))
    .reduce((prev, cur) => Math.max(prev, cur), 0);
}

@withStyles(styles)
class AnimationEditor extends React.Component<AnimationEditorProps, AnimationEditorState> {
  static createExtraData: (xml?: string) => ExtraData;

  canvas: ModelCanvas;
  editorElement: HTMLElement;

  private sandbox: Sandbox;

  constructor(props: AnimationEditorProps) {
    super(props);
    this.state = {
      progress: ProgressState.STOPPED,
      estimatedTime: 0,
    };
  }

  componentDidMount() {
    this.editorElement = findDOMNode<HTMLElement>(this.refs['editor']);

    this.editorElement.appendChild(this.props.extraData.container);
    Blockly.svgResize(this.props.extraData.workspace);
    Blockly.JavaScript.init(this.props.extraData.workspace);
    this.props.extraData.workspace.markFocused();
    this.props.extraData.workspaceHasMount = true;

    // Ignore events fired during initialization.
    setTimeout(() => this.props.extraData.workspace.addChangeListener(this.handleBlocklyChange), 0);

    this.updateEstimatedTime(this.props.extraData.workspace);

    const container = findDOMNode<HTMLCanvasElement>(this.refs['canvas']);
    this.canvas = new ModelCanvas(container, this.props.fileState);
    this.canvas.init();

    this.sandbox = new Sandbox(this.canvas);
  }

  componentWillReceiveProps(nextProps: AnimationEditorProps) {
    if (this.props.extraData.container !== nextProps.extraData.container) {
      this.props.extraData.workspace.removeChangeListener(this.handleBlocklyChange);
      this.editorElement.removeChild(this.props.extraData.container);

      this.editorElement.appendChild(nextProps.extraData.container);
      Blockly.svgResize(nextProps.extraData.workspace);
      Blockly.JavaScript.init(nextProps.extraData.workspace);
      nextProps.extraData.workspace.markFocused();
      nextProps.extraData.workspaceHasMount = true;
      nextProps.extraData.workspace.addChangeListener(this.handleBlocklyChange);

      this.updateEstimatedTime(nextProps.extraData.workspace);
    }

    if (this.props.fileState !== nextProps.fileState) {
      this.stop();
      this.canvas.onStateChange(nextProps.fileState);
    }
  }

  componentDidUpdate(prevProps: AnimationEditorProps) {
    if (prevProps.sizeVersion !== this.props.sizeVersion) {
      Blockly.svgResize(this.props.extraData.workspace);
      this.canvas.resize();
    }
  }

  componentWillUnmount() {
    this.sandbox.killAll();
    this.sandbox = null;

    // Deactivate workspace
    defaultWorkspace.markFocused();
    this.editorElement.removeChild(this.props.extraData.container);
    this.props.extraData.workspace.removeChangeListener(this.handleBlocklyChange);

    // Destory canvas
    this.canvas.destroy();
  }

  updateEstimatedTime(workspace: any) {
    this.setState({ estimatedTime: estimateWorkspaceTime(workspace) })
  }

  handleBlocklyChange = (event: any) => {
    if (event.type === Blockly.Events.UI) return;
    this.updateEstimatedTime(this.props.extraData.workspace);

    // // For debugging
    // const dom = Blockly.Xml.workspaceToDom(this.props.extraData.workspace);
    // const xml = Blockly.Xml.domToText(dom);
    // console.log(xml);

    this.props.onUpdate();
  };

  handleRunTouchTap = () => {
    switch(this.state.progress) {
      case ProgressState.STOPPED: {
        this.run();
        break;
      }
      case ProgressState.PLAYING: {
        this.stop();
        break;
      }
    }
  }

  run() {
    this.setState({ progress: ProgressState.PLAYING });

    const result = compileBlocklyXml(this.props.extraData.workspace);

    if (result['when_run']) {
      result['when_run'].forEach(code => this.sandbox.execute(code));
    }
  }

  stop() {
    this.sandbox.killAll();

    this.canvas.initMesh();
    this.canvas.render();

    this.setState({ progress: ProgressState.STOPPED });
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.leftPane}>
          <div className={styles.canvasCont}>
            <div ref="canvas" className={styles.canvas} />
            {this.renderOverlay()}
          </div>
          <div className={styles.canvasControl}>
            <Toolbar>
              <ToolbarGroup firstChild={true}>
                <RaisedButton
                  label={this.state.progress === ProgressState.STOPPED ? 'Run' : 'Reset'}
                  primary={this.state.progress === ProgressState.STOPPED}
                  secondary={this.state.progress !== ProgressState.STOPPED}
                  onTouchTap={this.handleRunTouchTap}
                />
              </ToolbarGroup>
            </Toolbar>
          </div>
        </div>
        <div className={styles.rightPane} ref="editor" />
      </div>
    );
  }

  renderOverlay() {
    return (
      <div className={styles.controls}>
        <ProgressBar
          className={styles.progressBar}
          maxValue={this.state.estimatedTime}
          repeat={false}
          state={this.state.progress}
        />
      </div>
    );
  }
}

AnimationEditor.createExtraData = (xml?: string) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.height = '100%';
  container.style.width = '100%';

  let workspace: any;

  try {
    blocklyRoot.appendChild(container);

    workspace = Blockly.inject(container, {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
      },
      trashcan: true,
      scrollbars: true,
    });

    const dom = Blockly.Xml.textToDom(xml || initBlock);
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch(error) {
    if (typeof error !== 'string') throw error;

    // Blockly throws string :(
    throw new Error(error);
  }

  // Blockly requires parent element until next frame.
  // If parent element is disconnected in this frame,
  // block element will be set to a weird position.
  setTimeout(() => {
    if (container.parentElement === blocklyRoot) blocklyRoot.removeChild(container);
  }, 0);

  return {
    container,
    workspace,
    workspaceHasMount: !!xml,
  };
};

export default AnimationEditor;
