import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import StateLayer from '@pasta/core/lib/StateLayer';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import Studio from '../../containers/Studio';

import { Project } from '@pasta/core/lib/Project';
import LocalServer, { LocalSocket } from '../../LocalServer';

import PlayNavbar from './components/PlayNavbar';
import {
  requestLogout,
} from '../../actions/auth';

import { Blockly } from '../../containers/Studio/containers/CodeEditor/blockly';

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
  studioState?: any;
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
class ProjectCreate extends React.Component<PlayProps, PlayState> {
  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  constructor(props) {
    super(props);
    this.state = { studioState: null };

    this.socket = new LocalSocket();

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.socket.addListener(event, handler);
        return () => token.remove();
      },
    });
  }

  componentDidMount() {
    const userId = shortid.generate();

    // const
    const serializedGameObject: SerializedGameObject = {
      id: userId,
      position: {
        x: 1,
        y: 0,
        z: 1,
      },
      mesh: null,
      direction: { x: 0, y: 0, z: 1 },
    };

    // Initialize data
    const serializedGameMap: SerializedGameMap = {
      id: shortid.generate(),
      name: '',
      width: 10,
      depth: 10,
      terrains: [],
      objects: [serializedGameObject],
    };

    this.server = new LocalServer({
      myId: userId,
      maps: [serializedGameMap],
    }, this.socket);

    this.stateLayer.start(this.server.getInitData());
  }

  componentWillUnmount() {
    this.server.destroy();
    this.server = null;

    this.stateLayer.destroy();
    this.stateLayer = null;
  }

  handleSave() {
    const { blocklyWorkspace: workspace } = this.state.studioState;
    const dom = Blockly.Xml.workspaceToDom(workspace);
    const xml = Blockly.Xml.domToText(dom);

    const scripts = {};

    workspace.getTopBlocks().forEach(block => {
      // TODO: Check if top block is an event emitter
      if (block.type === 'when_run') {
        if (!scripts[block.type]) scripts[block.type] = [];

        const code = Blockly.JavaScript.blockToCode(block);
        scripts[block.type].push(code);
      }
    });

    const serialized = this.server.serialize();
    this.props.runSaga(this.props.save, {
      scripts,
      blocklyXml: xml,
      server: serialized,
    });
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
        <Studio stateLayer={this.stateLayer} style={styles.studio}
                studioState={this.state.studioState}
                onUpdate={(studioState) => this.setState({ studioState })}
        />
      </div>
    );
  }
}

export default ProjectCreate;
