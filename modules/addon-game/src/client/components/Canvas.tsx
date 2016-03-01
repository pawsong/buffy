import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import initCanvas from '../canvas';

interface CanvasProps extends React.Props<Canvas> {
  style: Object;
  addonEmitter: EventEmitter;
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
  resizeToken: EventSubscription;

  componentDidMount() {
    this.canvas = initCanvas(
      this.refs['canvas'] as HTMLElement,
      this.props.stateLayer,
      this.context['store']
    );
    this.resizeToken = this.props.addonEmitter.addListener('resize', () => this.canvas.resize());
  }

  componentWillUnmount() {
    this.resizeToken.remove();
    this.canvas.destroy();
  }

  render() {
    return <div style={this.props.style} ref="canvas"></div>;
  }
};

export default Canvas;
