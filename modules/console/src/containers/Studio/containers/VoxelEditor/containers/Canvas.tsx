import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';

import initCanvas from '../canvas/views/main';

interface CanvasProps extends React.Props<Canvas> {
  sizeVersion: number;
  canvasShared: any;
}

class Canvas extends React.Component<CanvasProps, {}> {
  static contextTypes = {
    store: React.PropTypes.any.isRequired,
  }

  canvas;

  componentDidMount() {
    this.canvas = initCanvas(
      this.refs['canvas'] as HTMLElement,
      this.context['store'],
      this.props.canvasShared
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
