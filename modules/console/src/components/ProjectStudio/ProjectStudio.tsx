import * as React from 'react';
import ProjectStudioNavbar from './ProjectStudioNavbar';
import StateLayer from '@pasta/core/lib/StateLayer';
import { User } from '../../reducers/users';
import Studio, { StudioState } from '../../containers/Studio';

import { ProjectData, SerializedLocalServer, Scripts } from '@pasta/core/lib/Project';
import LocalServer, { LocalSocket } from '../../LocalServer';

import Blockly from '../../blockly';
import { convertXmlToCodes } from '../../blockly/utils';

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

interface ProjectStudioProps extends React.Props<ProjectStudio> {
  user: User;
  location: HistoryModule.Location;
  onLogout: () => any;
  onSave: (project: ProjectData) => any;
  onPush: (location: HistoryModule.LocationDescriptor) => any;
  initialBlocklyXml: string;
  initialLocalServer: SerializedLocalServer;
}

interface ProjectStudioState {
  studioState?: StudioState;
}

class ProjectStudio extends React.Component<ProjectStudioProps, ProjectStudioState> {
  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  constructor(props) {
    super(props);
    this.state = {
      studioState: Studio.creatState({
        codeEditorState: { blocklyXml: this.props.initialBlocklyXml },
      }),
    };

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
    this.server = new LocalServer(this.props.initialLocalServer, this.socket);
    this.stateLayer.start(this.server.getInitData());
  }

  componentWillUnmount() {
    this.server.destroy();
    this.server = null;

    this.stateLayer.destroy();
    this.stateLayer = null;
  }

  handleSave() {
    const { blocklyXml } = this.state.studioState.codeEditorState;
    const scripts = convertXmlToCodes(blocklyXml);
    const serialized = this.server.serialize();

    this.props.onSave({
      scripts,
      blocklyXml,
      server: serialized,
    });
  }

  render() {
    return (
      <div>
        <ProjectStudioNavbar user={this.props.user}
                             location={this.props.location}
                             onLogout={this.props.onLogout}
                             onSave={() => this.handleSave()}
                             onLinkClick={location => this.props.onPush(location)}
        />
        <Studio studioState={this.state.studioState}
                onChange={studioState => this.setState({ studioState })}
                initialBlocklyXml={this.props.initialBlocklyXml}
                stateLayer={this.stateLayer} style={styles.studio}
        />
      </div>
    );
  }
}

export default ProjectStudio;

