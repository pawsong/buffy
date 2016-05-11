import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';

import DesignManager from '../../../canvas/DesignManager';

import { WorldEditorCanvas } from '../canvas';
import { WorldEditorState, EditorMode, PlayModeState } from '../types';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  stateLayer: StateLayer;
  designManager: DesignManager;
  editorState: WorldEditorState;
  onChange: (state: WorldEditorState) => any;
  registerElement: (element: HTMLElement) => any;
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
  canvas: WorldEditorCanvas;

  pointerlockchange: () => any;

  componentDidMount() {
    this.canvas = new WorldEditorCanvas(
      this.refs['canvas'] as HTMLElement,
      this.props.designManager,
      this.props.stateLayer,
      () => this.props.editorState
    );
    this.canvas.init();

    const canvasElement = this.canvas.renderer.domElement;

    this.pointerlockchange = () => {
      if (this.props.editorState.mode !== EditorMode.PLAY) return;

      if (
           document.pointerLockElement === canvasElement
        || document['mozPointerLockElement'] === canvasElement
        || document['webkitPointerLockElement'] === canvasElement
      ) {
        // DO NOTHING
      } else {
        if (this.props.editorState.playMode !== PlayModeState.READY) {
          this.props.onChange({ playMode: PlayModeState.READY });
        }
      }
    };

    document.addEventListener('pointerlockchange', this.pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', this.pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', this.pointerlockchange, false);

    this.props.registerElement(this.canvas.renderer.domElement);
  }

  componentWillUnmount() {
    document.removeEventListener('pointerlockchange', this.pointerlockchange, false);
    document.removeEventListener('mozpointerlockchange', this.pointerlockchange, false);
    document.removeEventListener('webkitpointerlockchange', this.pointerlockchange, false);

    this.canvas.destroy();
  }

  componentWillReceiveProps(nextProps: CanvasProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.editorState !== nextProps.editorState) {
      this.canvas.onChange(nextProps.editorState);
    }
  }

  render() {
    return <div style={styles.root} ref="canvas"></div>;
  }
};

export default Canvas;
