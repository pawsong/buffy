import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import { Tabs, Tab } from '../Tabs';
import Colors from 'material-ui/lib/styles/colors';

const update = require('react-addons-update');
const objectAssign = require('object-assign');

import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import StateLayer from '@pasta/core/lib/StateLayer';
import Blockly from '../../blockly';
import * as StorageKeys from '../../constants/StorageKeys';
import { Sandbox, Scripts } from '../../sandbox';

import { saga, SagaProps, ImmutableTask } from '../../saga';
import { runBlocklyWorkspace, submitVoxel } from './sagas';

import Layout, { LayoutContainer } from '../../components/Layout';
import FileBrowser from './components/FileBrowser';

import { getIconName, getFileTypeLabel } from './utils';

import waitForMount from './components/waitForMount';
import FileTabs from './components/FileTabs';
import InstanceBrowser from './components/InstanceBrowser';
import Editor from './components/Editor';

import ZonePreview, {
  GameState,
} from '../../components/ZonePreview';
import CodeEditor, {
  CodeEditorState,
  CreateStateOptions as CreateCodeEditorStateOptions,
} from '../../components/CodeEditor';
import VoxelEditor, {
  VoxelEditorState,
  CreateStateOptions as CreateVoxelEditorStateOptions,
} from '../../components/VoxelEditor';

import { compileBlocklyXml } from '../../blockly/utils';

import { FileDescriptor, FileType } from './types';

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
  codeEditorState?: CodeEditorState;
  gameState?: GameState;
  voxelEditorState?: VoxelEditorState;
  files?: { [index: string]: FileDescriptor };
  activeFileId?: string;
}

interface StudioProps extends React.Props<Studio>, SagaProps {
  robotInstances: RobotInstance[];
  zoneInstances: ZoneInstance[];

  studioState: StudioState;
  onChange: (nextState: StudioState) => any;
  onOpenFileRequest: (fileType: FileType) => any;

  game?: React.ReactElement<any>;

  stateLayer: StateLayer;
  style?: React.CSSProperties;
  intl?: InjectedIntlProps;
  root?: ImmutableTask<any>;
  run?: ImmutableTask<any>;
  submitVoxel?: ImmutableTask<any>;
}

interface StudioOwnState { // UI states
  gameSizeVersion?: number;
  editorSizeVersion?: number;

  filesOnTab?: string[];
}

interface CreateStateOptions {
  codeEditorState?: CreateCodeEditorStateOptions;
  voxelEditorState?: CreateVoxelEditorStateOptions;
}

@waitForMount
@injectIntl
@saga({
  run: runBlocklyWorkspace,
  submitVoxel: submitVoxel,
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

  constructor(props, context) {
    super(props, context);
    this.state = {
      editorSizeVersion: 0,
      gameSizeVersion: 0,
      filesOnTab: ['1', '2'],
    };

    this.sandbox = new Sandbox(this.props.stateLayer);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.run);
  }

  handleRun() {
    const scripts = compileBlocklyXml(this.props.studioState.codeEditorState.blocklyXml);
    this.props.runSaga(this.props.run, this.sandbox, scripts);
  }

  handleStop() {
    this.props.cancelSaga(this.props.run);
  }

  handleVoxelEditorSubmit(data) {
    this.props.runSaga(this.props.submitVoxel, this.props.stateLayer, data);
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

  handleFileTabClose(fileId) {
    const index = this.state.filesOnTab.indexOf(fileId);
    if (index === -1) return;

    let nextActiveFileId = this.props.studioState.activeFileId;
    if (fileId === this.props.studioState.activeFileId) {
      if (index > 0) {
        nextActiveFileId = this.state.filesOnTab[index - 1];
      } else {
        if (this.state.filesOnTab.length > 1) {
          nextActiveFileId = this.state.filesOnTab[index + 1];
        } else {
          nextActiveFileId = '';
        }
      }
    }

    this.setState(update(this.state, {
      filesOnTab: { $splice: [[index, 1]] },
    }));
    this.handleStateChange({ activeFileId: nextActiveFileId });
  }

  renderEditor() {
    const files = this.state.filesOnTab.map(fileId => this.props.studioState.files[fileId]);
    const file = this.props.studioState.files[this.props.studioState.activeFileId];

    return (
      <div>
        <FileTabs
          files={files}
          activeFileId={this.props.studioState.activeFileId}
          onFileClick={fileId => this.handleStateChange({ activeFileId: fileId })}
          onFileClose={fileId => this.handleFileTabClose(fileId)}
          onTabOrderChange={(dragIndex, hoverIndex) => {
            const dragId = this.state.filesOnTab[dragIndex];
            this.setState(update(this.state, {
              filesOnTab: {
                $splice: [
                  [dragIndex, 1],
                  [hoverIndex, 0, dragId]
                ],
              }
            }));
          }}
        />
        <Editor
          codeEditorState={this.props.studioState.codeEditorState}
          voxelEditorState={this.props.studioState.voxelEditorState}
          editorSizeRevision={this.state.editorSizeVersion}
          onStateChange={state => this.handleStateChange(state)}
          file={file}
        />
      </div>
    );
  }

  handleFileBrowserItemClick(fileId: string) {
    let filesOnTab = this.state.filesOnTab;
    if (filesOnTab.indexOf(fileId) === -1) {
      filesOnTab = update(filesOnTab, { $push: [fileId] });
    }
    this.handleStateChange({ activeFileId: fileId });
    this.setState({ filesOnTab });
  }

  handleFileBrowserWidthResize(size) {
    localStorage.setItem(StorageKeys.MASTER_BROWSER_WIDTH, `${size}`);
    this.resizeEditor();
  }

  resizeEditor() {
    this.setState({ editorSizeVersion: this.state.editorSizeVersion + 1 });
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
            <Layout flow="column" className={styles.fillParent}>
              <LayoutContainer size={this.initialGameHeight} onResize={size => this.handleGameHeightResize(size)}>
                <ZonePreview
                  gameState={this.props.studioState.gameState}
                  onChange={(gameState => this.handleStateChange({ gameState }))}
                  sizeVersion={this.state.gameSizeVersion}
                  stateLayer={this.props.stateLayer}
                >
                  {this.props.game}
                </ZonePreview>
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <Toolbar style={{ backgroundColor: Colors.grey200 }}>
                  <ToolbarGroup key={0} float="right">
                    {controlButton}
                  </ToolbarGroup>
                </Toolbar>
                { /* Object instance browser */}
                <InstanceBrowser
                  robotInstances={this.props.robotInstances}
                  zoneInstances={this.props.zoneInstances}
                />
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true}>
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
        </Layout>
      </div>
    );
  }
}

Studio.creatState = (options: CreateStateOptions = {}): StudioState => {
  return {
    codeEditorState: CodeEditor.creatState(options.codeEditorState),
    gameState: ZonePreview.createState(),
    voxelEditorState: VoxelEditor.createState(options.voxelEditorState),
    files: {
      '1': {
        id: '1',
        name: 'Code',
        type: FileType.CODE,
      },
      '2': {
        id: '2',
        name: 'Design',
        type: FileType.DESIGN
      },
      '3': {
        id: '3',
        name: 'Robot 1',
        type: FileType.ROBOT,
      },
      // '4': {
      //   id: '4',
      //   name: 'Code 2',
      //   type: FileType.CODE,
      // },
    },
    activeFileId: '1',
  };
}

export default Studio;
