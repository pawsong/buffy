import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { UnitHandlerRouteParams } from '../Course/screens/Unit';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import Studio from '../../containers/Studio';
import LocalServer from './LocalServer';
import PlayNavbar from './components/PlayNavbar';
import {
  requestLogout,
} from '../../actions/auth';

import { save } from './sagas';

const NAVBAR_HEIGHT = 56;

const styles = {
  studio: {
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

interface PlayProps extends RouteComponentProps<{}, {}>, SagaProps {
  user: User;
  save: ImmutableTask<{}>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface PlayState {
  stateLayer?: StateLayer;
}

@saga({
  save: save,
})
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
})
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
    this.state.stateLayer.destroy();
    this.server = null;
  }

  handleSave() {
    const serialized = this.server.serialize();
    this.props.runSaga(this.props.save, serialized);
  }

  handleLogout() {
    this.props.requestLogout();
  }

  render() {
    return (
      <div>
        <PlayNavbar user={this.props.user}
                    location={this.props.location}
                    onLogout={() => this.handleLogout()}
                    onSave={() => this.handleSave()}
                    onLinkClick={location => this.props.push(location)}
        />
        <Studio stateLayer={this.state.stateLayer} style={styles.studio}
                studioState={null} onUpdate={() => {}}
        />
      </div>
    );
  }
}

export default Play;
