import * as React from 'react';
import { connect } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router';
import { call } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import * as io from 'socket.io-client';
import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';

import Studio, { StudioState } from '../../components/Studio';
import { saga, ImmutableTask, SagaProps } from '../../saga';
import { connectApi, get, ApiCall, ApiDispatchProps } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { requestLogout } from '../../actions/auth';

import { GameUser } from './base';

import ContactsButton from './components/ContactsButton';
import ContactsDialog from './components/ContactsDialog';

import OnlineStudioNavbar from './components/OnlineStudioNavbar';

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

interface OnlineStudioProps extends RouteComponentProps<{}, {}>, SagaProps, ApiDispatchProps {
  stateLayer: StateLayer;
  moveMap?: ImmutableTask<void>;
  users?: ApiCall<GameUser[]>;
  user?: User;
  requestLogout?: any;
  push?: any;
}

interface OnlineStudioState {
  initialized?: boolean;
  studioState?: StudioState;
  friendsModalOpened?: boolean;
}

@connectApi(() => ({
  users: get(`${CONFIG_GAME_SERVER_URL}/friends`),
}))
@saga({
  moveMap: function* (stateLayer: StateLayer, mapId: string) {
    yield call(stateLayer.rpc.moveMap, { id: mapId });
  },
})
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
})
class OnlineStudio extends React.Component<OnlineStudioProps, OnlineStudioState> {
  stateLayer: StateLayer;
  socket: SocketIOClient.Socket;

  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      friendsModalOpened: false,
    };
  }

  componentDidMount() {
    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        this.socket.addEventListener(event, handler);
        return () => this.socket.removeEventListener(event, handler);
      },
    });

    // Try to connect
    this.socket = io(CONFIG_GAME_SERVER_URL);
    this.socket.once('init', (params: InitParams) => {
      this.stateLayer.start(params);
      this.setState({
        initialized: true,
        studioState: Studio.creatState(),
      });
    });
  }

  componentWillUnmount() {
    this.stateLayer.destroy();
    this.socket.close();
  }

  handleContactsButtonClick() {
    this.props.request(this.props.users);
    this.setState({ friendsModalOpened: true });
  }

  handleContactsDialogClose() {
    this.setState({ friendsModalOpened: false });
  }

  handleContactsDialogSubmit(mapId) {
    this.handleContactsDialogClose();
    this.props.runSaga(this.props.moveMap, this.stateLayer, mapId);
  }

  renderGame() {
    return (
      <div>
        <ContactsButton onTouchTap={() => this.handleContactsButtonClick()} />
        <ContactsDialog open={this.state.friendsModalOpened}
                        friends={this.props.users.result || []}
                        onSubmit={mapId => this.handleContactsDialogSubmit(mapId)}
                        onClose={() => this.handleContactsDialogClose()}
        />
      </div>
    );
  }

  renderStudio() {
    const game = this.renderGame();

    return (
      <Studio studioState={this.state.studioState}
              onChange={studioState => this.setState({ studioState })}
              stateLayer={this.stateLayer}
              style={styles.studio}
              game={game}
      />
    );
  }

  render() {
    const studio = this.state.initialized ? this.renderStudio() : (
      <div>Connecting...</div>
    );

    return (
      <div>
        <OnlineStudioNavbar location={this.props.location} user={this.props.user}
                            onLogout={() => this.props.requestLogout()}
                            onLinkClick={location => this.props.push(location)}
        />
        {studio}
      </div>
    );
  }
}

export default OnlineStudio;
