import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';

import DesignManager from '../../../DesignManager';

import GameZoneView from '../GameZoneView';
import { GameState } from '../interface';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  stateLayer: StateLayer;
  designManager: DesignManager;
  gameState: GameState;
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

  canvas: GameZoneView;

  componentDidMount() {
    this.canvas = new GameZoneView(
      this.refs['canvas'] as HTMLElement,
      this.props.stateLayer,
      this.props.designManager,
      () => this.props.gameState
    );
  }

  componentWillReceiveProps(nextProps: CanvasProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.gameState !== nextProps.gameState) {
      this.canvas.onChange(nextProps.gameState);
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
