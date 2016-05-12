import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Project, ProjectData, SerializedLocalServer } from '@pasta/core/lib/Project';
import StateLayer from '@pasta/core/lib/StateLayer';

const update = require('react-addons-update');
const objectAssign = require('object-assign');

import LocalServer, { LocalSocket } from '../../LocalServer';
import DesignManager from '../../canvas/DesignManager';
import { connectApi, preloadApi, ApiCall, get, ApiDispatchProps } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import * as StorageKeys from '../../constants/StorageKeys';
import Studio, { StudioState } from '../../components/Studio';
import { FileType, SourceFile } from '../../components/Studio/types';
import { WorldEditorState } from '../../components/WorldEditor';
import { requestLogout } from '../../actions/auth';
import { compileBlocklyXml } from '../../blockly/utils';

import { NewFileSpec } from './types';

import * as Immutable from 'immutable';

import ProjectStudioNavbar from './components/ProjectStudioNavbar';
import NewRobotFileDialog from './components/NewRobotFileDialog';

import { RecipeEditorState } from '../../components/RecipeEditor';

import generateObjectId from '../../utils/generateObjectId';

const msgpack = require('msgpack-lite');

import {
  createFile,
  createFiles,
  loadProject,
  createAnonProject,
  createUserProject,
  updateAnonProject,
  updateUserProject,
} from './sagas';

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

enum ProjectStudioMode {
  CREATE,
  ANON_EDIT,
  USER_EDIT,
}

interface ProjectMetadata {
}

interface RouteParams {
  username: string;
  projectId: string;
}

function inferProjectStudioMode(params: RouteParams): ProjectStudioMode {
  if (params.projectId) {
    return params.username ? ProjectStudioMode.USER_EDIT : ProjectStudioMode.ANON_EDIT;
  }
  return ProjectStudioMode.CREATE;
}

interface WorkingCopy {
  fileId: string;
  created: boolean;
  modified: boolean;
  type: FileType;
  data: any;
}

interface ProjectStudioHandlerProps extends RouteComponentProps<RouteParams, RouteParams>, ApiDispatchProps, SagaProps {
  user: User;
  projectMetadata?: ApiCall<ProjectMetadata>;
  createFile?: ImmutableTask<{}>;
  createFiles?: ImmutableTask<{}>;
  loadProject?: ImmutableTask<Project>;
  createAnonProject: ImmutableTask<{}>;
  createUserProject: ImmutableTask<{}>;
  updateAnonProject: ImmutableTask<{}>;
  updateUserProject: ImmutableTask<{}>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface ProjectStudioHandlerState {
  stateLayerIsRunning?: boolean;
  studioState?: StudioState;
  // Files
  // activeFiles
  workingCopies?: { [index: string]: WorkingCopy };
  activeWorkingCopyId?: string;

  newFileDialogOpen?: boolean;
}

function rgbToHex({ r, g, b }) {
  return (r << 16) | (g << 8) | b;
}

function updateKey(object, currentKey, nextKey): any {
  const ret = {};
  Object.keys(object).forEach(key => {
    if (currentKey === key) {
      ret[nextKey] = object[key];
    } else {
      ret[key] = object[key];
    };
  });
  return ret;
}

/*
 * ProjectStudioHandler component handles various modes to support url change without rerendering.
 *
 * Create mode: StateLayer is started in componentDidMount with localStorage data.
 * Edit mode (preloaded): StateLayer is started in componentDidMount with preloaded data.
 * Edit mode (not preloaded): StartLayer is started componentWillReceiveProps when response arrives.
 */

@preloadApi<RouteParams>((params, location) => {
  const type = inferProjectStudioMode(params);
  if (type === ProjectStudioMode.CREATE) return;

  // Preload meta info only.
  const projectMetadata = type === ProjectStudioMode.ANON_EDIT
    ? get(`${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`)
    : get(`${CONFIG_API_SERVER_URL}/projects/@${params.username}/${params.projectId}`);

  return { projectMetadata };
})
@connectApi()
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
}) as any)
@saga({
  createFile,
  createFiles,
  loadProject,
  createAnonProject,
  createUserProject,
  updateAnonProject,
  updateUserProject,
})
class ProjectStudioHandler extends React.Component<ProjectStudioHandlerProps, ProjectStudioHandlerState> {
  mode: ProjectStudioMode;

  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  designManager: DesignManager;

  constructor(props) {
    super(props);

    this.mode = inferProjectStudioMode(this.props.params);

    this.state = {
      stateLayerIsRunning: false,
      newFileDialogOpen: false,
    };

    this.socket = new LocalSocket();

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emitFromClientToServer(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.socket.addEventFromServerListener(event, handler);
        return () => token.remove();
      },
    });
  }

  componentDidMount() {
    this.designManager = new DesignManager();

    if (this.mode === ProjectStudioMode.CREATE) {
      this.setState(this.createStateFromLocalStorage(), () => this.initStudio());
    } else {
      const { params } = this.props;

      const projectUrl = this.mode === ProjectStudioMode.ANON_EDIT
        ? `${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`
        : `${CONFIG_API_SERVER_URL}/projects/@${params.username}/${params.projectId}`;

      this.props.runSaga(this.props.loadProject, projectUrl, project => {
        this.setState(this.createStateFromResponse(project), () => this.initStudio());
      });
    }
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.loadProject);

    if (this.server) {
      this.server.destroy();
      this.server = null;
    }

    this.stateLayer.destroy();
    this.stateLayer = null;

    if (this.designManager) {
      this.designManager.dispose();
      this.designManager = null;
    }
  }

  createStateFromLocalStorage(): ProjectStudioHandlerState {
    const playerId = shortid.generate();

    const codeFileId = generateObjectId();
    const designFileId = generateObjectId();
    const robotFileId = generateObjectId();
    const worldFileId = generateObjectId();

    const studioState = Studio.creatState({
      codeFileId,
      designFileId,
      robotFileId,
      worldFileId,
      playerId,
    });

    return {
      studioState,
    };
  }

  createStateFromResponse(project: Project): ProjectStudioHandlerState {
    const voxels = Object.keys(project.voxels).map(key => {
      const voxel = project.voxels[key];
      return {
        position: [voxel.position.x, voxel.position.y, voxel.position.z],
        color: voxel.color,
      };
    });

    return {
      studioState: Studio.creatState({
        codeEditorState: { blocklyXml: project.blocklyXml },
        voxelEditorState: { voxels },
      }),
    };
  }

  initStudio() {
    const { files } = this.state.studioState;

    Object.keys(files)
      .map(key => files[key])
      .filter(file => file.type === FileType.DESIGN)
      .forEach(file => {
        const loader = this.designManager.getOrCreateLoader(file.id);
        loader.preventGarbageCollection();
        loader.loadFromMemory(file.id, file.state.voxel.present.mesh);
      });

    this.startStateLayer();
  }

  startStateLayer() {
    this.server = new LocalServer(this.state.studioState.files, this.state.studioState.worldId, this.socket);
    this.stateLayer.start(this.server.getInitData());
    this.setState({ stateLayerIsRunning: true });
  }

  componentWillReceiveProps(nextProps: ProjectStudioHandlerProps) {
    if (this.props.params !== nextProps.params) {
      this.mode = inferProjectStudioMode(nextProps.params);
    }
  }

  handleSave() {
    // Create files
    // const buffer = msgpack.encode(this.state.studioState.codeEditorState.blocklyXml);
    // this.props.runSaga(this.props.createFiles, [{
    //   name: 'name',
    //   format: 'format',
    //   data: buffer.toArrayBuffer()
    // }]);

    const fileId = this.state.studioState.activeFileId;
    const file = this.state.studioState.files[fileId];
    if (!file.modified) return;

    const worldFile = this.state.studioState.files[this.state.studioState.worldId];
    const world: WorldEditorState = worldFile.state;

    // this.setState(update(this.state, {
    //   studioState: { workingCopies: { [workingCopyId]: {
    //     created: { $set: false },
    //     modified: { $set: false },
    //   } } },
    // }));

    switch(file.type) {
      case FileType.DESIGN: {
        const mesh = file.state.voxel.present.mesh;
        this.stateLayer.rpc.updateMesh({
          objectId: world.playerId,
          designId: fileId,
          mesh: mesh,
        });
      }
      case FileType.ROBOT: {
        const state: RecipeEditorState = file.state;
        this.stateLayer.rpc.updateRobot({
          objectId: world.playerId,
          robot: file.id,
          design: state.design,
        });
      }
    }

    if (file.created) {
      // Serialize
      // const buffer = msgpack.encode(this.state.studioState.codeEditorState.blocklyXml);

      // // Save
      // this.props.runSaga(this.props.createFile, {
      //   name: 'name',
      //   format: 'format',
      //   data: buffer.toArrayBuffer()
      // }, fileId => this.setState(update(this.state, {
      //   workingCopies: {
      //     [workingCopyId]: {
      //       fileId: { $set: fileId },
      //       created: { $set: false },
      //       modified: { $set: false },
      //     },
      //   },
      // })));
    } else {

    }

    // // Game
    // const serialized = this.server.serialize();

    // // Code editor
    // const { blocklyXml } = this.state.studioState.codeEditorState;
    // const scripts = compileBlocklyXml(blocklyXml);

    // // Voxel editor

    // const voxels = this.state.studioState.voxelEditorState.voxel.present.data.toArray().map(voxel => {
    //   return {
    //     position: voxel.position,
    //     color: rgbToHex(voxel.color),
    //   };
    // });

    // const data: ProjectData = {
    //   scripts,
    //   blocklyXml,
    //   server: serialized,
    //   voxels,
    // };

    // switch (this.mode) {
    //   case ProjectStudioMode.CREATE: {
    //     if (this.props.user) {
    //       this.props.runSaga(this.props.createUserProject, data);
    //     } else {
    //       this.props.runSaga(this.props.createAnonProject, data);
    //     }
    //     return;
    //   }
    //   case ProjectStudioMode.ANON_EDIT: {
    //     const { projectId } = this.props.routeParams;
    //     this.props.runSaga(this.props.updateAnonProject, projectId, data);
    //     return;
    //   }
    //   case ProjectStudioMode.USER_EDIT: {
    //     const { username, projectId } = this.props.routeParams;
    //     this.props.runSaga(this.props.updateUserProject, username, projectId, data);
    //     return;
    //   }
    // }
  }

  handleVrModeRequest() {
    if (this.mode === ProjectStudioMode.ANON_EDIT) {
      this.props.push(`/@/${this.props.params.projectId}/latest/vr`);
    } else if (this.mode === ProjectStudioMode.USER_EDIT) {
      this.props.push(`/@${this.props.params.username}/${this.props.params.projectId}/latest/vr`);
    }
  }

  handleStudioStateChange(nextState: StudioState) {
    // if (this.mode === ProjectStudioMode.CREATE) {
    //   if (this.state.studioState.codeEditorState.blocklyXml !== nextState.codeEditorState.blocklyXml) {
    //     localStorage.setItem(StorageKeys.BLOCKLY_WORKSPACE_CREATE, nextState.codeEditorState.blocklyXml);
    //   }
    // }
    this.setState({ studioState: nextState });
  }

  handleOpenFileRequest(fileType: FileType) {
    alert([
      'Open file in create mode is WIP.',
      'Please try again in connect mode',
      '(http://buffy.run/connect).',
    ].join('\n'));
  }

  handleNewFileDialogOpen() {
    this.setState({ newFileDialogOpen: true });
  }

  handleNewFile(specs: NewFileSpec[]) {
    const files: { [index: string]: SourceFile } = {};
    specs.forEach((spec, index) => {
      const file: SourceFile = files[spec.id] = {
        id: spec.id,
        name: '',
        type: spec.type,
        created: true,
        modified: false,
        readonly: false,
        state: spec.data,
      };

      if (spec.type === FileType.DESIGN) {
        const loader = this.designManager.getOrCreateLoader(file.id);
        loader.preventGarbageCollection();
        loader.loadFromMemory(file.id, file.state.voxel.present.mesh);
      }
    });

    this.setState({
      studioState: update(this.state.studioState, {
        files: { $merge: files },
        filesOnTab: { $push: specs.map(spec => spec.id) },
        activeFileId: { $set: specs[specs.length - 1].id },
      }),
      newFileDialogOpen: false,
    });
  }

  render() {
    if (!this.state.stateLayerIsRunning) {
      return <div>Loading now...</div>;
    }

    return (
      <div>
        <ProjectStudioNavbar
          user={this.props.user}
          location={this.props.location}
          onLogout={() => this.props.requestLogout()}
          onNewFile={specs => this.handleNewFile(specs)}
          onCreateNewRobotFile={() => this.setState({ newFileDialogOpen: true })}
          onSave={() => this.handleSave()}
          onLinkClick={location => this.props.push(location)}
          vrModeAvaiable={this.mode !== ProjectStudioMode.CREATE}
          onVrModeRequest={() => this.handleVrModeRequest()}
        />
        <Studio
          studioState={this.state.studioState}
          onChange={studioState => this.handleStudioStateChange(studioState)}
          onOpenFileRequest={fileType => this.handleOpenFileRequest(fileType)}
          stateLayer={this.stateLayer}
          designManager={this.designManager}
          style={styles.studio}
          editorFocus={!this.state.newFileDialogOpen}
        />
        <NewRobotFileDialog
          files={this.state.studioState.files}
          open={this.state.newFileDialogOpen}
          onClose={() => this.setState({ newFileDialogOpen: false })}
          onSubmit={specs => this.handleNewFile(specs)}
        />
      </div>
    );
  }
}

export default ProjectStudioHandler;
