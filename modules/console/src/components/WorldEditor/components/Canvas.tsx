import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';

import { SourceFileDB } from '../../Studio/types';

import DesignManager from '../../../canvas/DesignManager';

import { WorldEditorCanvas } from '../canvas';

import {
  Action,
  PlayState,
  WorldEditorState,
  EditorMode,
  PlayModeState,
  DispatchAction,
  SubscribeAction,
} from '../types';

import {
  changePlayState,
} from '../actions';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  stateLayer: StateLayer;
  designManager: DesignManager;
  editorState: WorldEditorState;
  dispatchAction: DispatchAction;
  registerElement: (element: HTMLElement) => any;
  files: SourceFileDB;
  subscribeAction: SubscribeAction;
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
    this.canvas = new WorldEditorCanvas({
      container: this.refs['canvas'] as HTMLElement,
      designManager: this.props.designManager,
      stateLayer: this.props.stateLayer,
      getState: () => this.props.editorState,
      dispatchAction: this.props.dispatchAction,
      subscribeAction: this.props.subscribeAction,
      getFiles: () => this.props.files,
    });
    this.canvas.init();

    const canvasElement = this.canvas.renderer.domElement;

    this.pointerlockchange = () => {
      if (this.props.editorState.common.mode !== EditorMode.PLAY) return;

      if (
           document.pointerLockElement === canvasElement
        || document['mozPointerLockElement'] === canvasElement
        || document['webkitPointerLockElement'] === canvasElement
      ) {
        // DO NOTHING
      } else {
        if (this.props.editorState.playMode.state !== PlayState.READY) {
          this.props.dispatchAction(changePlayState(PlayState.READY));
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

  }

  componentDidUpdate(prevProps: CanvasProps) {
    if (prevProps.editorState !== this.props.editorState) {
      this.canvas.onChange(this.props.editorState);
    }
  }

  render() {
    return <div style={styles.root} ref="canvas"></div>;
  }
};

export default Canvas;
