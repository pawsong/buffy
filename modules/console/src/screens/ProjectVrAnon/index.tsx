import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
const update = require('react-addons-update');
import { findDOMNode } from 'react-dom';
import { Styles } from 'material-ui';
import RaisedButton from 'material-ui/lib/raised-button';
import IconButton from 'material-ui/lib/icon-button';
const Contacts = require('material-ui/lib/svg-icons/communication/contacts');
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Project } from '@pasta/core/lib/Project';
import { connectApi, preloadApi, ApiCall, get } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { UnitHandlerRouteParams } from '../Course/screens/Unit';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import Studio from '../../containers/Studio';
import VrCanvas from '../../canvas/VrCanvas';
import { Sandbox } from '../../sandbox';
import PlayNavbar from './components/PlayNavbar';
import {
  requestLogout,
} from '../../actions/auth';
import LocalServer, { LocalSocket } from '../../LocalServer';

let screenfull;
if (__CLIENT__) {
  screenfull = require('screenfull');
}

import { save } from './sagas';

const NAVBAR_HEIGHT = 56;

const messages = defineMessages({
  start: {
    id: 'vr.start',
    description: 'VR Start button label',
    defaultMessage: 'Start',
  },
});

const styles = {
  readyContainer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyContent: {
    position: 'relative',
    textAlign: 'center',
  },
  studio: {
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  buttonLabel: {
    fontSize: 48,
  },
  fullscreenButton: {
    backgroundColor: 'black',
    float: 'right',
  },
};

interface ProjectEditAnonRouteParams {
  projectId: string;
}
interface ProjectEditAnonParams extends ProjectEditAnonRouteParams {}

interface ProjectEditAnonProps
    extends RouteComponentProps<ProjectEditAnonParams, ProjectEditAnonRouteParams>, SagaProps {
  project: ApiCall<Project>;
  user: User;
  save: ImmutableTask<{}>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

interface ProjectVrAnonState {
  fullscreen?: boolean;
  started?: boolean;
}

@preloadApi<ProjectEditAnonParams>(params => ({
  project: get(`${CONFIG_API_SERVER_URL}/projects/${params.projectId}`),
}))
@connectApi()
@saga({
  save: save,
})
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
})
@injectIntl
class ProjectVrAnon extends React.Component<ProjectEditAnonProps, ProjectVrAnonState> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  //the key passed through context must be called "muiTheme"
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  muiTheme: Styles.MuiTheme;

  // (fake) server interface
  server: LocalServer;
  stateLayer: StateLayer;

  canvas: VrCanvas;
  sandbox: Sandbox;

  listenFullscreenEvent: EventListenerObject;

  constructor(props, context) {
    super(props, context);

    this.muiTheme = update(context.muiTheme, {
      button: { height: { $set: 64 } },
    });

    this.state = { started: false };
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  componentDidMount() {
    this.listenFullscreenEvent = (() => this.setState({ fullscreen: screenfull.isFullscreen })) as any;
    document.addEventListener(screenfull.raw.fullscreenchange, this.listenFullscreenEvent);
  }

  componentWillUnmount() {
    document.removeEventListener(screenfull.raw.fullscreenchange, this.listenFullscreenEvent);

    if (this.sandbox) this.sandbox.destroy();
    if (this.canvas) this.canvas.destroy();

    if (this.stateLayer) this.stateLayer.destroy();
    if (this.server) this.server.destroy();
  }

  handleStartButtonClick() {
    if (screenfull.enabled) screenfull.request();
    if (this.state.started) return;

    this.setState({ started: true });

    const socket = new LocalSocket();

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        const token = socket.addListener(event, handler);
        return () => token.remove();
      },
    });

    const { server, scripts } = this.props.project.result;

    this.server = new LocalServer(server, socket);
    this.stateLayer.start(this.server.getInitData());

    this.canvas = new VrCanvas({
      stateLayer: this.stateLayer,
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
    });

    // Initialize code
    this.sandbox = new Sandbox(this.stateLayer);
    this.sandbox.exec(scripts);
    this.sandbox.emit('when_run');
  }

  handleFullscreenButtonClick() {
    if (screenfull.enabled) screenfull.request();
  }

  renderReadyMode() {
    return (
      <div style={styles.readyContainer}>
        <div style={styles.readyContent}>
          <RaisedButton label={this.props.intl.formatMessage(messages.start)}
                        labelStyle={styles.buttonLabel}
                        disabled={this.props.project.state !== 'fulfilled'}
                        primary={true}
                        onTouchTap={() => this.handleStartButtonClick()}
          />
        </div>
      </div>
    );
  }

  renderPlayMode() {
    const fullscreenButtonStyle = update(styles.fullscreenButton, {
      display: { $set: this.state.fullscreen ? 'none' : 'block' },
    });

    return (
      <div>
        <IconButton style={fullscreenButtonStyle}
                    onTouchTap={() => this.handleFullscreenButtonClick()}
                    tooltipPosition="bottom-center"
                    tooltip="Friends"
        >
          <Contacts color="white"/>
        </IconButton>
      </div>
    );
  }

  render() {
    const body = this.state.started ? this.renderPlayMode() : this.renderReadyMode();

    return (
      <div>
        <div ref="canvas" style={styles.canvas}></div>
        {body}
      </div>
    );
  }
}

export default ProjectVrAnon;
