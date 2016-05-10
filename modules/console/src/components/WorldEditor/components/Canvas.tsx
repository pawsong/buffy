import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';

import DesignManager from '../../../DesignManager';

import WorldEditorCanvas from '../WorldEditorCanvas';
import { WorldEditorState } from '../types';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  stateLayer: StateLayer;
  designManager: DesignManager;
  editorState: WorldEditorState;
}

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};

class Canvas extends React.Component<CanvasProps, {}> {
  static contextTypes = {
    store: React.PropTypes.any.isRequired,
  }

  canvas: WorldEditorCanvas;

  componentDidMount() {
    this.canvas = new WorldEditorCanvas(
      this.refs['canvas'] as HTMLElement,
      this.props.stateLayer,
      this.props.designManager,
      () => this.props.editorState
    );
  }

  componentWillReceiveProps(nextProps: CanvasProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.editorState !== nextProps.editorState) {
      this.canvas.onChange(nextProps.editorState);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div style={styles.root} ref="canvas"></div>;
  }
};

export default Canvas;
