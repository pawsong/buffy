import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { connect as connectStateLayer } from '../../../../../containers/stateLayer';

import initCanvas from '../canvas';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  stateLayer: StateLayer;
}

class Canvas extends React.Component<CanvasProps, {}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'Canvas';

  static contextTypes = {
    store: React.PropTypes.any.isRequired,
  }

  canvas;

  componentDidMount() {
    this.canvas = initCanvas(
      this.refs['canvas'] as HTMLElement,
      this.props.stateLayer,
      this.context['store']
    );
  }

  componentWillReceiveProps(nextProps: CanvasProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
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

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};
