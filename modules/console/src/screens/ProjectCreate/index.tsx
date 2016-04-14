import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';

import { Project, ProjectData, SerializedLocalServer } from '@pasta/core/lib/Project';

import * as StorageKeys from '../../constants/StorageKeys';

import ProjectStudio from '../../components/ProjectStudio';

import { requestLogout } from '../../actions/auth';

import { save } from './sagas';

interface PlayProps extends RouteComponentProps<{}, {}>, SagaProps {
  user: User;
  save: ImmutableTask<{}>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface PlayState {
  mount: boolean;
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
  initialLocalServer: SerializedLocalServer;
  initialBlocklyXml: string;

  constructor(props) {
    super(props);
    this.state = { mount: false };
  }

  componentDidMount() {
    this.initialBlocklyXml =localStorage.getItem(StorageKeys.BLOCKLY_WORKSPACE) || '';

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

    this.initialLocalServer = {
      myId: userId,
      maps: [serializedGameMap],
    };

    this.setState({ mount: true });
  }

  handleSave(data: ProjectData) {
    this.props.runSaga(this.props.save, data);
  }

  render() {
    if (!this.state.mount) {
      return <div>Loading now...</div>;
    }

    return (
      <ProjectStudio user={this.props.user}
                     location={this.props.location}
                     onLogout={() => this.props.requestLogout()}
                     onSave={data => this.handleSave(data)}
                     onPush={location => this.props.push(location)}
                     initialBlocklyXml={this.initialBlocklyXml}
                     initialLocalServer={this.initialLocalServer}
      />
    );
  }
}

export default ProjectCreate;
