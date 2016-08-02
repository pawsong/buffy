import React from 'react';
import { findDOMNode } from 'react-dom';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import IconButton from 'material-ui/IconButton';
import ActionHome from 'material-ui/svg-icons/action/home';
import PlayArrow from 'material-ui/svg-icons/av/play-arrow';
import Stop from 'material-ui/svg-icons/av/stop';
import Pause from 'material-ui/svg-icons/av/pause';

import Sandbox, {SandboxProcess, estimateTime} from './Sandbox';

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
if (__CLIENT__) require('../../blockly/blocks');

import { ExtraData } from './types';

interface AnimationEditorProps {
  fileState: ModelFileState;
  extraData: ExtraData;
  onUpdate: () => any;
}

interface AnimationEditorState {
  progress?: ProgressState;
  estimatedTime?: number;
}

function estimateWorkspaceTime(workspace: any) {
  const result = compileBlocklyXml(workspace);
  if (!result['when_start']) return 0;

  return result['when_start']
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
      this.editorElement.removeChild(this.props.extraData.container);
      this.editorElement.appendChild(nextProps.extraData.container);
      Blockly.svgResize(nextProps.extraData.workspace);
      nextProps.extraData.workspace.markFocused();
      Blockly.JavaScript.init(nextProps.extraData.workspace);

      this.props.extraData.workspace.removeChangeListener(this.handleBlocklyChange);
      nextProps.extraData.workspace.addChangeListener(this.handleBlocklyChange);

      this.updateEstimatedTime(nextProps.extraData.workspace);
    }

    if (this.props.fileState !== nextProps.fileState) {
      this.handleClickStop();
      this.canvas.onStateChange(nextProps.fileState);
    }
  }

  componentWillUnmount() {
    this.sandbox.killAll();
    this.sandbox = null;

    this.editorElement.removeChild(this.props.extraData.container);
    this.props.extraData.workspace.removeChangeListener(this.handleBlocklyChange);
    this.canvas.destroy();
  }

  updateEstimatedTime(workspace: any) {
    this.setState({ estimatedTime: estimateWorkspaceTime(workspace) })
  }

  handleBlocklyChange = (event: any) => {
    if (event.type === Blockly.Events.UI) return;
    this.updateEstimatedTime(this.props.extraData.workspace);

    this.props.onUpdate();
  };

  handleClickPlay = () => {
    this.setState({ progress: ProgressState.PLAYING });

    const result = compileBlocklyXml(this.props.extraData.workspace);

    if (result['when_start']) {
      result['when_start'].forEach(code => this.sandbox.execute(code));
    }
  }

  handleClickStop = () => {
    this.sandbox.killAll();

    this.canvas.initMesh();
    this.canvas.render();

    this.setState({ progress: ProgressState.STOPPED });
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.leftPane} ref="editor" />
        <div className={styles.rightPane}>
          <div ref="canvas" className={styles.canvas} />
          {this.renderOverlay()}
        </div>
      </div>
    );
  }

  renderControlButton() {
    switch(this.state.progress) {
      case ProgressState.STOPPED: {
        return (
          <IconButton
            onTouchTap={this.handleClickPlay}
          >
            <PlayArrow />
          </IconButton>
        );
      }
      case ProgressState.PLAYING: {
        return (
          <IconButton
            onTouchTap={this.handleClickStop}
          >
            <Stop />
          </IconButton>
        );
      }
    }
    return null;
  }

  renderOverlay() {
    return (
      <div className={styles.controls}>
        {this.renderControlButton()}
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

let blocklyRoot: HTMLElement;
if (__CLIENT__) {
  blocklyRoot = document.createElement('div');
  document.body.appendChild(blocklyRoot);
  blocklyRoot.style.visibility = 'hidden';
}

AnimationEditor.createExtraData = (xml?: string) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.height = '100%';
  container.style.width = '100%';

  blocklyRoot.appendChild(container);

  const workspace = Blockly.inject(container, {
    toolbox,
    grid: {
      spacing: 20,
      length: 3,
      colour: '#ccc',
    },
    trashcan: true,
  });

  const dom = Blockly.Xml.textToDom(xml || initBlock);
  Blockly.Xml.domToWorkspace(dom, workspace);

  // Blockly requires parent element until next frame.
  // If parent element is disconnected in this frame,
  // block element will be set to a weird position.
  setTimeout(() => {
    if (container.parentElement === blocklyRoot) blocklyRoot.removeChild(container);
  }, 0);

  return {
    container,
    workspace,
  };
};

export default AnimationEditor;