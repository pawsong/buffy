import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Link } from 'react-router';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { State } from '../../reducers';
import { UnitHandlerRouteParams } from '../Course/screens/Unit';
import Studio from '../../containers/Studio';
import LocalServer from './LocalServer';

const styles = {
  studio: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

interface PlayProps extends React.Props<Play> {

}

interface PlayState {
  stateLayer?: StateLayer;
}

class Play extends React.Component<PlayProps, PlayState> {
  server: LocalServer;

  constructor(props) {
    super(props);
    this.state = { stateLayer: null };
  }

  componentDidMount() {
    this.server = new LocalServer();

    const stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.server.emit(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.server.addListener(event, handler);
        return () => token.remove();
      },
      update: (callback) => {
        let frameId = requestAnimationFrame(update);
        let then = Date.now();
        function update() {
          const now = Date.now();
          callback(now - then);
          then = now;
          frameId = requestAnimationFrame(update);
        }
        return () => cancelAnimationFrame(frameId);
      },
    }, this.server.getInitData());

    this.setState({ stateLayer });
  }

  componentWillUnmount() {
    this.server.destroy();
    this.server = null;
  }

  render() {
    return (
      <div>
        <Studio stateLayer={this.state.stateLayer} style={styles.studio} />
      </div>
    );
  }
}

export default Play;
