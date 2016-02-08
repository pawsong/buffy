import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import initCanvas from '../canvas';

interface CanvasProps extends React.Props<Canvas> {
  style: Object;
  stateLayer?: StateLayer;
}

@connectStateLayer()
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

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div style={this.props.style} ref="canvas"></div>;
  }
};

export default Canvas;
