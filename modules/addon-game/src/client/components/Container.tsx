import * as React from 'react';
import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/helper/lib/ReactStateLayer/connect';

import Main from './Main';
import ContactsButton from './ContactsButton';

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

interface ContainerProps extends React.Props<Container> {
  stateLayer?: StateLayer;
}

@connectStateLayer()
class Container extends React.Component<ContainerProps, {
  mapName: string;
}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'Container';

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
      <Main style={styles.main}/>
      <div style={styles.info}>Map: {this.state.mapName}</div>
      <ContactsButton/>
    </div>;
  }
}

export default Container;
