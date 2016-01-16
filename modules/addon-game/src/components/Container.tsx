import * as React from 'react';
import Main from './Main';

export interface ContainerProps extends React.Props<Container> {
  gameStore;
  api;
}

export class Container extends React.Component<ContainerProps, {}> {
  render() {
    return <Main gameStore={this.props.gameStore} api={this.props.api}/>;
  }  
}

export default Container;
