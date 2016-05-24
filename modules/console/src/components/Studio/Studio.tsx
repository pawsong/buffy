import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import { Tabs, Tab } from '../Tabs';
import Colors from 'material-ui/lib/styles/colors';

const update = require('react-addons-update');
const objectAssign = require('object-assign');
import * as shortid from 'shortid';

import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import StateLayer from '@pasta/core/lib/StateLayer';
import * as StorageKeys from '../../constants/StorageKeys';

import ModelManager from '../../canvas/ModelManager';

import Layout, { LayoutContainer } from '../../components/Layout';

import { getIconName, getFileTypeLabel } from './utils';

import FileBrowser from './components/FileBrowser';
import waitForMount from './components/waitForMount';
import FileTabs from './components/FileTabs';
import Editor from './components/Editor';

import WorldEditor, {
  WorldEditorState,
  WorldFileState,
} from '../../components/WorldEditor';
import CodeEditor, {
  CodeEditorState,
  CreateStateOptions as CreateCodeEditorStateOptions,
} from '../../components/CodeEditor';
import ModelEditor, {
  ModelEditorState,
} from '../../components/ModelEditor';

import { compileBlocklyXml } from '../../blockly/utils';

import { FileDescriptor, FileType, SourceFile, RobotState } from './types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Studio.css');

const messages = defineMessages({
  run: {
    id: 'run',
    description: 'Run code',
    defaultMessage: 'Run',
  },
  stop: {
    id: 'stop',
    description: 'Stop code',
    defaultMessage: 'Stop',
  },
  code: {
    id: 'code',
    description: 'Write code for robot with blocks',
    defaultMessage: 'Code',
  },
  design: {
    id: 'design',
    description: 'Design robot with blocks',
    defaultMessage: 'Design',
  },
});

export interface StudioState {
  files?: { [index: string]: SourceFile };
  activeFileId?: string;
  filesOnTab?: string[];
  worldId?: string;
}

interface StudioProps extends React.Props<Studio> {
  studioState: StudioState;
  onChange: (nextState: StudioState) => any;
  onOpenFileRequest: (fileType: FileType) => any;
  onModelApply: (file: SourceFile) => any;

  game?: React.ReactElement<any>;

  stateLayer: StateLayer;
  modelManager: ModelManager;
  style?: React.CSSProperties;
  intl?: InjectedIntlProps;
}

interface StudioOwnState { // UI states
  gameSizeVersion?: number;
  editorSizeVersion?: number;
  worldEditorState?: WorldEditorState;
}

interface CreateStateOptions {
  codeEditorState?: CreateCodeEditorStateOptions;
  codeFileId?: string;
  designFileId?: string;
  robotFileId?: string;
  worldFileId?: string;
  playerId?: string;
}

@waitForMount
@injectIntl
@(DragDropContext(HTML5Backend) as any)
@withStyles(styles)
class Studio extends React.Component<StudioProps, StudioOwnState> {
  static creatState: (options?: CreateStateOptions) => StudioState;

  initialTabIndex: number;
  initialGameWidth: number;
  initialGameHeight: number;
  initialBrowserWidth: number;

  activeTabName: string;

  constructor(props: StudioProps, context) {
    super(props, context);

    const worldFile = props.studioState.files[props.studioState.worldId];
    const world: WorldFileState = worldFile.state;
    const worldData = world.present.data;

    this.state = {
      editorSizeVersion: 0,
      gameSizeVersion: 0,
      worldEditorState: WorldEditor.createEditorState(worldData.robots[worldData.playerId].zone),
    };
  }

  componentWillMount() {
    this.initialGameWidth = parseInt(localStorage.getItem(StorageKeys.MASTER_GAME_WIDTH_SIZE) || 600, 10);
    this.initialGameHeight = parseInt(localStorage.getItem(StorageKeys.MASTER_GAME_HEIGHT_SIZE) || 480, 10);
    this.initialBrowserWidth = parseInt(localStorage.getItem(StorageKeys.MASTER_BROWSER_WIDTH) || 150, 10);
  }

  handleGameWidthResize(size) {
    localStorage.setItem(StorageKeys.MASTER_GAME_WIDTH_SIZE, `${size}`);

    // Resize game & editor
    this.setState({
      gameSizeVersion: this.state.gameSizeVersion + 1,
      editorSizeVersion: this.state.editorSizeVersion + 1,
    });
  }

  handleGameHeightResize(size) {
    localStorage.setItem(StorageKeys.MASTER_GAME_HEIGHT_SIZE, `${size}`);

    // Resize game only
    this.setState({
      gameSizeVersion: this.state.gameSizeVersion + 1,
    });
  }

  handleStateChange(nextState: StudioState) {
    this.props.onChange(objectAssign({}, this.props.studioState, nextState));
  }

  handleFileTabClose(fileId: string) {
    const index = this.props.studioState.filesOnTab.indexOf(fileId);
    if (index === -1) return;

    let activeFileId = this.props.studioState.activeFileId;
    if (fileId === this.props.studioState.activeFileId) {
      if (index > 0) {
        activeFileId = this.props.studioState.filesOnTab[index - 1];
      } else {
        if (this.props.studioState.filesOnTab.length > 1) {
          activeFileId = this.props.studioState.filesOnTab[index + 1];
        } else {
          activeFileId = '';
        }
      }
    }

    const filesOnTab = update(this.props.studioState.filesOnTab, { $splice: [[index, 1]] });
    this.handleStateChange({
      filesOnTab,
      activeFileId,
    });
  }

  handleFileChange = (id: string, state: any, modified: boolean) => {
    const file = this.props.studioState.files[id];

    this.props.onChange(update(this.props.studioState, {
      files: { [id]: {
        modified: { $set: modified },
        state: { $set: state },
      } },
    }));
  }

  handleFileTabOrderChange(dragIndex, hoverIndex) {
    const dragId = this.props.studioState.filesOnTab[dragIndex];
    this.handleStateChange({
      filesOnTab: update(this.props.studioState.filesOnTab, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragId],
        ],
      }),
    });
  }

  renderEditor() {
    const files = this.props.studioState.filesOnTab.map(fileId => this.props.studioState.files[fileId]);
    const file = this.props.studioState.files[this.props.studioState.activeFileId];

    return (
      <div>
        <FileTabs
          files={files}
          activeFileId={this.props.studioState.activeFileId}
          onFileClick={fileId => this.handleStateChange({ activeFileId: fileId })}
          onFileClose={fileId => this.handleFileTabClose(fileId)}
          onTabOrderChange={(dragIndex, hoverIndex) => this.handleFileTabOrderChange(dragIndex, hoverIndex)}
        />
        <Editor
          editorSizeRevision={this.state.editorSizeVersion}
          onFileChange={this.handleFileChange}
          onModelApply={this.props.onModelApply}
          file={file}
          files={this.props.studioState.files}
          modelManager={this.props.modelManager}
        />
      </div>
    );
  }

  handleFileBrowserItemClick(fileId: string) {
    let { filesOnTab } = this.props.studioState;
    if (filesOnTab.indexOf(fileId) === -1) {
      filesOnTab = update(filesOnTab, { $push: [fileId] });
    }
    this.handleStateChange({
      filesOnTab,
      activeFileId: fileId,
    });
  }

  handleFileBrowserWidthResize(size) {
    localStorage.setItem(StorageKeys.MASTER_BROWSER_WIDTH, `${size}`);
    this.resizeEditor();
  }

  resizeEditor() {
    this.setState({ editorSizeVersion: this.state.editorSizeVersion + 1 });
  }

  handleWorldEditorStateChanage = (worldEditorState: WorldEditorState) => {
    this.setState({ worldEditorState });
  }

  handleWorldFileStateChanage = (worldFileState: WorldFileState) => {
    const worldFile = this.props.studioState.files[this.props.studioState.worldId];

    this.handleFileChange(this.props.studioState.worldId, worldFileState,
      WorldEditor.isModified(worldFile.savedState, worldFileState)
    );
  }

  render() {
    const editor = this.renderEditor();

    return (
      <div style={this.props.style}>
        <Layout flow="row" className={styles.content}>
          <LayoutContainer size={this.initialGameWidth} onResize={size => this.handleGameWidthResize(size)}>
            <FileBrowser
              onFileClick={fileId => this.handleFileBrowserItemClick(fileId)}
              files={this.props.studioState.files}
              initialWidth={this.initialBrowserWidth}
              onOpenFileRequest={this.props.onOpenFileRequest}
              onWidthResize={size => this.handleFileBrowserWidthResize(size)}
              resizeEditor={() => this.resizeEditor()}
            >
              {editor}
            </FileBrowser>
          </LayoutContainer>
          <LayoutContainer remaining={true}>
            <WorldEditor
              editorState={this.state.worldEditorState}
              onEditorStateChange={this.handleWorldEditorStateChanage}
              fileState={this.props.studioState.files[this.props.studioState.worldId].state}
              onFileStateChanage={this.handleWorldFileStateChanage}
              sizeVersion={this.state.gameSizeVersion}
              stateLayer={this.props.stateLayer}
              modelManager={this.props.modelManager}
              files={this.props.studioState.files}
            >
              {this.props.game}
            </WorldEditor>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

Studio.creatState = (options: CreateStateOptions = {}): StudioState => {
  const { codeFileId, designFileId, robotFileId, worldFileId } = options;

  const modelState = ModelEditor.createFileState();
  const modelFile = {
    id: designFileId,
    created: true,
    modified: false,
    readonly: false,
    name: 'Model',
    type: FileType.MODEL,
    savedState: modelState,
    state: modelState,
    extraData: ModelEditor.createExtraData(),
  };

  const codeState = CodeEditor.createState();
  const codeFile = {
    id: codeFileId,
    created: true,
    modified: false,
    readonly: false,
    name: 'Code',
    type: FileType.CODE,
    savedState: codeState,
    state: codeState,
    extraData: CodeEditor.createExtraData(),
  };

  const recipeState: RobotState = {
    codes: [codeFileId],
    design: designFileId,
  };
  const recipeFile = {
    id: robotFileId,
    created: true,
    modified: false,
    readonly: false,
    name: 'Recipe',
    type: FileType.ROBOT,
    savedState: recipeState,
    state: recipeState,
  };

  const worldState = WorldEditor.createFileState(worldFileId, {
    recipe: robotFileId,
  });
  const worldFile = {
    id: worldFileId,
    created: true,
    modified: false,
    readonly: false,
    name: 'World',
    type: FileType.WORLD,
    savedState: worldState,
    state: worldState,
  };

  const files: { [idnex: string]: SourceFile } = {
    [modelFile.id]: modelFile,
    [codeFile.id]: codeFile,
    [recipeFile.id]: recipeFile,
    [worldFile.id]: worldFile,
  };

  const filesOnTab = Object.keys(files).filter(key => files[key].created);

  return {
    files,
    activeFileId: designFileId,
    filesOnTab,
    worldId: worldFileId,
  };
}

export default Studio;
