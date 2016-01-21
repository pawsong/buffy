import * as React from 'react';
import Main from './Main';
import StateLayer from '@pasta/addon/lib/StateLayer';

export interface ContainerProps extends React.Props<Container> {
  stateLayer: StateLayer;
}

export class Container extends React.Component<ContainerProps, {}> {
  render() {
    return <Main stateLayer={this.props.stateLayer}/>;
  }
}

export default Container;
