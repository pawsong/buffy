import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as ndarray from 'ndarray';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import * as classNames from 'classnames';
import IconButton from 'material-ui/IconButton';
import PlayArrow from 'material-ui/svg-icons/av/play-arrow';
import Stop from 'material-ui/svg-icons/av/stop';

import { Scripts } from '@pasta/core/lib/types';

import Blockly from '../../../../../blockly';
import { compileBlocklyXml } from '../../../../../blockly/utils';

if (__CLIENT__) {
  require('../../../../../blockly/blocks');
}

import ProgressBar, { ProgressState } from '../../../../../components/ProgressBar';
import ModelCanvas from '../../../../../canvas/ModelCanvas';
import { FileState } from '../../../../../components/ModelEditor/types';
import Sandbox, { estimateTime } from '../../../../../Sandbox';

const styles = require('./ModelViewer.css');

const rootClass = [
  'row',
  styles.root,
].join(' ');

const inlineStyles = {
  root: {
    width: 100,
    height: 100,
  },
}

interface ModelViewerProps {
  fileState: FileState;
  blockly: string;
  animateImmediately: boolean;
}

interface ModelVeiwerState {
  scripts?: Scripts;
  estimatedTime?: number;
  progress?: ProgressState;
}

function compileBlockly(blockly: string): {
  scripts?: Scripts;
  estimatedTime?: number;
} {
  if (!blockly) {
    return { scripts: null, estimatedTime: 0 };
  }

  try {
    const xml = Blockly.Xml.textToDom(blockly)

    // Create a headless workspace.
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(xml, workspace);
    Blockly.JavaScript.init(workspace);

    const scripts = compileBlocklyXml(workspace);
    const estimatedTime = scripts['when_run'] ? scripts['when_run']
      .map(code => estimateTime(code))
      .reduce((prev, cur) => Math.max(prev, cur), 0) : 0;

    return { scripts, estimatedTime };
  } catch(error) {
    if (typeof error !== 'string') throw error;

    // Blockly throws string :(
    throw new Error(error);
  }
}

@withStyles(styles)
class ModelViewer extends React.Component<ModelViewerProps, ModelVeiwerState> {
  canvas: ModelCanvas;
  sandbox: Sandbox;

  constructor(props: ModelViewerProps) {
    super(props);

    const { scripts, estimatedTime } = compileBlockly(props.blockly);
    this.state = {
      scripts,
      estimatedTime,
      progress: ProgressState.STOPPED,
    };
  }

  componentWillReceiveProps(nextProps: ModelViewerProps) {
    if (this.props.blockly !== nextProps.blockly) {
      this.stop();

      const { scripts, estimatedTime } = compileBlockly(nextProps.blockly);
      this.setState({ scripts, estimatedTime });
    }
  }

  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['root']);

    this.canvas = new ModelCanvas(container, this.props.fileState);
    this.canvas.init();

    this.sandbox = new Sandbox(this.canvas);

    if (this.props.animateImmediately) this.run();
  }

  componentWillUnmount() {
    this.sandbox.killAll();
    this.canvas.destroy();

    // TODO: Destroy geometryFactory
  }

  run() {
    this.setState({ progress: ProgressState.PLAYING });
    if (!this.state.scripts['when_run']) return;
    this.state.scripts['when_run'].forEach(code => this.sandbox.execute(code));
  }

  stop() {
    this.sandbox.killAll();

    this.canvas.initMesh();
    this.canvas.render();

    this.setState({ progress: ProgressState.STOPPED });
  }

  handleAnimationToggle = () => {
    if (this.state.progress === ProgressState.STOPPED) {
      this.run();
    } else {
      this.stop();
    }
  }

  render() {
    return (
      <div className={styles.modelViewerCont}>
        <div className={rootClass}>
          <div className={styles.wrapper}>
            <div className={styles.main} ref="root"></div>
          </div>
        </div>
        {this.state.scripts && (
          <div className={styles.animationControls}>
            <IconButton
              onTouchTap={this.handleAnimationToggle}
            >
              {this.state.progress === ProgressState.STOPPED ? <PlayArrow /> : <Stop />}
            </IconButton>
            <ProgressBar
              className={styles.progressBar}
              state={this.state.progress}
              maxValue={this.state.estimatedTime}
              repeat={false}
            />
          </div>
        )}
      </div>
    );
  }
}

export default ModelViewer;
