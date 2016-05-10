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
import Blockly from '../../blockly';
import * as StorageKeys from '../../constants/StorageKeys';
import { Sandbox, Scripts } from '../../sandbox';

import { saga, SagaProps, ImmutableTask } from '../../saga';
import { runBlocklyWorkspace, CompiledCodes } from './sagas';

import DesignManager from '../../DesignManager';

import Layout, { LayoutContainer } from '../../components/Layout';

import { getIconName, getFileTypeLabel } from './utils';

import FileBrowser from './components/FileBrowser';
import waitForMount from './components/waitForMount';
import FileTabs from './components/FileTabs';
import InstanceBrowser from './components/InstanceBrowser';
import Editor from './components/Editor';

import WorldEditor, {
  WorldEditorState,
} from '../../components/WorldEditor';
import CodeEditor, {
  CodeEditorState,
  CreateStateOptions as CreateCodeEditorStateOptions,
} from '../../components/CodeEditor';
import VoxelEditor, {
  VoxelEditorState,
  CreateStateOptions as CreateVoxelEditorStateOptions,
} from '../../components/VoxelEditor';

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

import { RobotInstance, ZoneInstance } from './types';

export interface StudioState {
  worldEditorState?: WorldEditorState;

  files?: { [index: string]: SourceFile };
  activeFileId?: string;
  filesOnTab?: string[];
}

interface StudioProps extends React.Props<Studio>, SagaProps {
  robotInstances: RobotInstance[];
  zoneInstances: ZoneInstance[];

  studioState: StudioState;
  onChange: (nextState: StudioState) => any;
  onOpenFileRequest: (fileType: FileType) => any;

  editorFocus: boolean;

  game?: React.ReactElement<any>;

  stateLayer: StateLayer;
  designManager: DesignManager;
  style?: React.CSSProperties;
  intl?: InjectedIntlProps;
  root?: ImmutableTask<any>;
  run?: ImmutableTask<any>;
}

interface StudioOwnState { // UI states
  gameSizeVersion?: number;
  editorSizeVersion?: number;
}

interface CreateStateOptions {
  codeEditorState?: CreateCodeEditorStateOptions;
  voxelEditorState?: CreateVoxelEditorStateOptions;
  codeFileId?: string;
  designFileId?: string;
  robotFileId?: string;
  mapFileId?: string;
  playerId?: string;
}

@waitForMount
@injectIntl
@saga({
  run: runBlocklyWorkspace,
})
@(DragDropContext(HTML5Backend) as any)
@withStyles(styles)
class Studio extends React.Component<StudioProps, StudioOwnState> {
  static creatState: (options?: CreateStateOptions) => StudioState;

  initialTabIndex: number;
  initialGameWidth: number;
  initialGameHeight: number;
  initialBrowserWidth: number;

  activeTabName: string;

  sandbox: Sandbox;

  constructor(props: StudioProps, context) {
    super(props, context);

    this.state = {
      editorSizeVersion: 0,
      gameSizeVersion: 0,
    };

    this.sandbox = new Sandbox(this.props.stateLayer);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.run);
  }

  handleRun() {
    // Find robots
    const robotStates = {};
    this.props.robotInstances.forEach(robotInstance => {
      robotStates[robotInstance.templateId] = this.props.studioState.files[robotInstance.templateId].state;
    });

    const codesSet = {};
    Object.keys(robotStates).forEach(robotId => {
      const robotState = robotStates[robotId];
      robotState.codes.forEach(code => codesSet[code] = true);
    });

    const codes: CompiledCodes = {};
    Object.keys(codesSet).map(codeId => {
      const codeState = this.props.studioState.files[codeId].state;
      codes[codeId] = compileBlocklyXml(codeState.blocklyXml);
    });

    this.props.runSaga(this.props.run, this.sandbox, codes, this.props.robotInstances.map(instance => {
      const robotState = robotStates[instance.templateId];
      return {
        objectId: instance.id,
        codeIds: robotState.codes,
      };
    }));
  }

  handleStop() {
    this.props.cancelSaga(this.props.run);
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

  handleFileChange(id: string, state: any) {
    const file = this.props.studioState.files[id];
    const modified = file.modified || file.state !== state;

    this.props.onChange(update(this.props.studioState, {
      files: { [id]: {
        modified: { $set: modified },
        state: { $merge: state },
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
          onFileChange={(id, state) => this.handleFileChange(id, state)}
          file={file}
          files={this.props.studioState.files}
          focus={this.props.editorFocus}
          designManager={this.props.designManager}
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

  selectPlayer(playerId: string) {
    this.handleStateChange({
      worldEditorState: objectAssign({}, this.props.studioState.worldEditorState, { playerId }),
    });
  }

  render() {
    const controlButton = this.props.run.state === 'running'
      ? <RaisedButton
          label={this.props.intl.formatMessage(messages.stop)}
          secondary={true}
          onTouchTap={() => this.handleStop()}
        />
      : <RaisedButton
          label={this.props.intl.formatMessage(messages.run)}
          primary={true}
          onTouchTap={() => this.handleRun()}
        />;

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
              editorState={this.props.studioState.worldEditorState}
              onChange={(worldEditorState => this.handleStateChange({ worldEditorState }))}
              sizeVersion={this.state.gameSizeVersion}
              stateLayer={this.props.stateLayer}
              designManager={this.props.designManager}
              files={this.props.studioState.files}
              robots={this.props.robotInstances}
              zones={this.props.zoneInstances}
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
  const { codeFileId, designFileId, robotFileId } = options;

  const robotState: RobotState = {
    codes: [codeFileId],
    design: designFileId,
  };

  const files: { [idnex: string]: SourceFile } = {
    [designFileId]: {
      id: designFileId,
      created: true,
      modified: false,
      readonly: false,
      name: 'Design',
      type: FileType.DESIGN,
      state: VoxelEditor.createState(designFileId, options.voxelEditorState),
    },
    [codeFileId]: {
      id: codeFileId,
      created: true,
      modified: false,
      readonly: false,
      name: 'Code',
      type: FileType.CODE,
      state: CodeEditor.creatState(codeFileId, options.codeEditorState),
    },
    [robotFileId]: {
      id: robotFileId,
      created: true,
      modified: false,
      readonly: false,
      name: 'Recipe',
      type: FileType.ROBOT,
      state: robotState,
    },
  };

  const filesOnTab = Object.keys(files).filter(key => files[key].created);

  return {
    worldEditorState: WorldEditor.createState(options.playerId),
    files,
    activeFileId: designFileId,
    filesOnTab,
  };
}

export default Studio;
