import * as React from 'react';
import Main from './Main';
import StateLayer from '@pasta/core/lib/StateLayer';
import { EventSubscription } from 'fbemitter';

const styles = {
  main: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  info: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'white',
  },
};

export interface ContainerProps extends React.Props<Container> {
  stateLayer: StateLayer;
}

export class Container extends React.Component<ContainerProps, {
  mapName: string;
}> {

  state = {
    mapName: '',
  };

  token: EventSubscription;

  componentDidMount() {
    this.token = this.props.stateLayer.store.subscribe.resync(() => {
      this.setState({ mapName: this.props.stateLayer.store.map.id });
    });
    this.setState({ mapName: this.props.stateLayer.store.map.id });
  }

  componentWillUnmount() {
    this.token.remove();
  }

  render() {
    return <div>
      <Main style={styles.main} stateLayer={this.props.stateLayer}/>
      <div style={styles.info}>Map: {this.state.mapName}</div>
    </div>;
  }
}

export default Container;
