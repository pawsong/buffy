import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import initCanvas from '../canvas';

interface MainProps extends React.Props<Main> {
  style: Object;
  stateLayer?: StateLayer;
}

@connectStateLayer()
class Main extends React.Component<MainProps, {}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'Main';

  canvas;

  componentDidMount() {
    this.canvas = initCanvas(this.refs['canvas'] as HTMLElement, this.props.stateLayer);
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div style={this.props.style} ref="canvas"></div>;
  }
};

export default Main;
