import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import { Tabs, Tab } from '../Tabs';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';

import Avatar from 'material-ui/lib/avatar';
import ActionAssignment from 'material-ui/lib/svg-icons/action/assignment';
import LayersIcon from 'material-ui/lib/svg-icons/maps/layers';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import ActionInfo from 'material-ui/lib/svg-icons/action/info';
import AndroidIcon from 'material-ui/lib/svg-icons/action/android';

import FlatButton from 'material-ui/lib/flat-button';

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
import FileList from './components/FileList';

import { getIconName, getFileTypeLabel } from './utils';

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

export interface RobotInstance {
  id: string;
  name: string;
  mapName: string;
}

export interface ZoneInstance {
  id: string;
  name: string;
  width: number;
  depth: number;
}

export interface StudioState {
  codeEditorState?: CodeEditorState;
  gameState?: GameState;
  voxelEditorState?: VoxelEditorState;
}

interface StudioBodyProps extends React.Props<Studio>, SagaProps {
  robotInstances: RobotInstance[];
  zoneInstances: ZoneInstance[];

  studioState: StudioState;
  onChange: (nextState: StudioState) => any;
  onOpenFileRequest: (fileType: FileType) => any;

  game: React.ReactElement<any>;

  stateLayer: StateLayer;
  style?: React.CSSProperties;
  intl?: InjectedIntlProps;
  root?: ImmutableTask<any>;
  run?: ImmutableTask<any>;
  submitVoxel?: ImmutableTask<any>;
}

enum InstanceTabs {
  ROBOT,
  ZONE,
};

function getInstanceTabLabel(tabType: InstanceTabs) {
  switch(tabType) {
    case InstanceTabs.ROBOT: {
      return 'Robot';
    }
    case InstanceTabs.ZONE: {
      return 'Zone';
    }
  }
}

interface StudioBodyState {
  gameSizeVersion?: number;
  editorSizeVersion?: number;
  activeTab?: string;

  files?: { [index: string]: FileDescriptor },
  activeFileId?: string;
  filesOnTab?: string[];

  fileBrowserOpen?: boolean;
  fileBrowserTypeFilter?: FileType;
  instanceTabs?: InstanceTabs[],
  activeInstanceTab?: InstanceTabs,
}

interface FileTabsProps extends React.Props<FileTabs> {
  files: FileDescriptor[];
  activeFileId: string;
  onFileClick(fileId: string): any;
  onFileClose(fileId: string): any;
  onTabOrderChange(dragIndex: number, hoverIndex: number): any;
}

class FileTabs extends React.Component<FileTabsProps, {}> {
  render() {
    const tabs = this.props.files.map((file, index) => {
      const style = index === 0 ? {
        borderLeft: 'none',
      } : undefined;

      return (
        <Tab
          key={file.id}
          value={file.id}
          style={style}
          label={file.name}
        />
      );
    });

    return (
      <Tabs
        activeValue={this.props.activeFileId}
        onTabClick={value => this.props.onFileClick(value)}
        onTabOrderChange={this.props.onTabOrderChange}
        closable={true}
        onTabClose={value => this.props.onFileClose(value)}
      >
        {tabs}
      </Tabs>
    );
  }
}

@injectIntl
@saga({
  run: runBlocklyWorkspace,
  submitVoxel: submitVoxel,
})
@(DragDropContext(HTML5Backend) as any)
@withStyles(styles)
class StudioBody extends React.Component<StudioBodyProps, StudioBodyState> {
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
      activeTab: localStorage.getItem(StorageKeys.MASTER_INITIAL_TAB) || 'code',
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
        // '3': {
        //   id: '3',
        //   name: 'Robot 1',
        //   type: FileType.ROBOT,
        // },
        // '4': {
        //   id: '4',
        //   name: 'Code 2',
        //   type: FileType.CODE,
        // },
      },
      filesOnTab: ['1', '2'],
      activeFileId: '1',
      fileBrowserOpen: false,
      fileBrowserTypeFilter: FileType.ALL,
      instanceTabs: [InstanceTabs.ROBOT, InstanceTabs.ZONE],
      activeInstanceTab: InstanceTabs.ROBOT,
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

  onTabChange(value) {
    this.setState({
      activeTab: value,
      editorSizeVersion: this.state.editorSizeVersion + 1,
    });
    localStorage.setItem(StorageKeys.MASTER_INITIAL_TAB, value);
  }

  handleStateChange(nextState: StudioState) {
    this.props.onChange(objectAssign({}, this.props.studioState, nextState));
  }

  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.studioState.codeEditorState}
        onChange={codeEditorState => this.handleStateChange({ codeEditorState })}
        sizeRevision={this.state.editorSizeVersion}
        readyToRender={true}
      />
    );
  }

  renderDesignEditor() {
    return (
      <VoxelEditor
        editorState={this.props.studioState.voxelEditorState}
        onChange={voxelEditorState => this.handleStateChange({ voxelEditorState })}
        sizeVersion={this.state.editorSizeVersion}
        onSubmit={(data) => this.handleVoxelEditorSubmit(data)}
      />
    );
  }

  renderRobotEditor() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{  }}>
          <h1>Robot editor</h1>

          <h2>Codes for this robot</h2>
          <div>Code list</div>
          <div>Add button (Open browser)</div>

          <h2>Design for this robot</h2>
          <div>Preview</div>
          <div>Select button (Open browser)</div>
        </div>
      </div>
    );
  }

  handleFileTabClose(fileId) {
    const index = this.state.filesOnTab.indexOf(fileId);
    if (index === -1) return;

    let nextActiveFileId = this.state.activeFileId;
    if (fileId === this.state.activeFileId) {
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
      activeFileId: { $set: nextActiveFileId },
    }));
  }

  renderEditor() {
    const files = this.state.filesOnTab.map(fileId => this.state.files[fileId]);
    const file = this.state.files[this.state.activeFileId];

    let editor = null;

    if (file) {
      switch(file.type) {
        case FileType.CODE: {
          editor = this.renderCodeEditor();
          break;
        }
        case FileType.DESIGN: {
          editor = this.renderDesignEditor();
          break;
        }
        case FileType.ROBOT: {
          editor = this.renderRobotEditor();
          break;
        }
      }
    }

    return (
      <div>
        <FileTabs
          files={files}
          activeFileId={this.state.activeFileId}
          onFileClick={fileId => this.setState({ activeFileId: fileId })}
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
        <div className={styles.addon}>{editor}</div>
      </div>
    );
  }

  toggleFileBrowser(fileType: FileType) {
    if (this.state.fileBrowserTypeFilter === fileType) {
      this.setState({
        fileBrowserOpen: !this.state.fileBrowserOpen,
      }, () => this.setState({
        editorSizeVersion: this.state.editorSizeVersion + 1,
      }));
    } else {
      this.setState({
        fileBrowserOpen: true,
        fileBrowserTypeFilter: fileType,
      }, () => this.setState({
        editorSizeVersion: this.state.editorSizeVersion + 1
      }));
    }
  }

  handleFileBrowserItemClick(fileId: string) {
    let filesOnTab = this.state.filesOnTab;
    if (filesOnTab.indexOf(fileId) === -1) {
      filesOnTab = update(filesOnTab, { $push: [fileId] });
    }
    this.setState({
      activeFileId: fileId,
      filesOnTab,
    });
  }

  renderFileBrowser() {
    if (!this.state.fileBrowserOpen) return null;

    const files = Object.keys(this.state.files).map(fileId => this.state.files[fileId]);

    const buttons = this.state.fileBrowserTypeFilter === FileType.DESIGN ? (
      <div style={{ marginTop: 8 }}>
        <FlatButton
          label="Open file"
          style={{ width: '100%' }}
          onTouchTap={() => this.props.onOpenFileRequest(FileType.DESIGN)}
        />
      </div>
    ) : null;

    return (
      <div>
        {buttons}
        <FileList
          files={files}
          filter={this.state.fileBrowserTypeFilter}
          onFileTouchTap={fileId => this.handleFileBrowserItemClick(fileId)}
        />
      </div>
    );
  }

  renderRobotInstanceList() {
    return this.props.robotInstances.map(inst => {
      return (
        <ListItem
          key={inst.id}
          leftAvatar={<Avatar icon={<AndroidIcon />} backgroundColor={Colors.blue500} />}
          rightIcon={<ActionInfo />}
          primaryText={inst.name}
          secondaryText={`Map: ${inst.mapName}`}
        />
      );
    });
  }

  renderZoneInstanceList() {
    return this.props.zoneInstances.map(inst => {
      return (
        <ListItem
          key={inst.id}
          leftAvatar={<Avatar icon={<LayersIcon />} backgroundColor={Colors.amber500} />}
          rightIcon={<ActionInfo />}
          primaryText={inst.name}
          secondaryText={`Size: ${inst.width} x ${inst.depth}`}
        />
      );
    });
  }

  renderInstanceBrowser() {
    const tabs = (
      <Tabs
        activeValue={this.state.activeInstanceTab}
        onTabClick={value => this.setState({ activeInstanceTab: value })}
        onTabOrderChange={(dragIndex: number, hoverIndex: number) => {
          const dragId = this.state.instanceTabs[dragIndex];
          this.setState(update(this.state, {
            instanceTabs: {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, dragId]
              ],
            }
          }));
        }}
        closable={false}
      >
        {
          this.state.instanceTabs.map(tabType => {
            return (
              <Tab
                key={tabType}
                value={tabType}
                label={getInstanceTabLabel(tabType)}
              />
            );
          })
        }
      </Tabs>
    );

    let listItems = null;
    switch(this.state.activeInstanceTab) {
      case InstanceTabs.ROBOT: {
        listItems = this.renderRobotInstanceList();
        break;
      }
      case InstanceTabs.ZONE: {
        listItems = this.renderZoneInstanceList();
        break;
      }
    }

    return (
      <div>
        {tabs}
        <List>{listItems}</List>
      </div>
    );
  }

  handleFileBrowserWidthResize(size) {
    const activeEditorType = this.state.files[this.state.activeFileId].type;
    localStorage.setItem(StorageKeys.MASTER_BROWSER_WIDTH, `${size}`);

    // Resize editor
    this.setState({
      editorSizeVersion: this.state.editorSizeVersion + 1,
    });
  }

  renderFileBrowserButtons() {
    const types = [
      FileType.ROBOT,
      FileType.DESIGN,
      FileType.CODE,
      FileType.ALL,
    ];

    const buttons = types.map(type => {
      const active = this.state.fileBrowserOpen && this.state.fileBrowserTypeFilter === type;

      return (
        <IconButton
          key={type}
          iconClassName="material-icons"
          iconStyle={{ color: active ? Colors.black : Colors.grey500 }}
          tooltip={getFileTypeLabel(type)}
          onTouchTap={() => this.toggleFileBrowser(type)}
          className={styles.fileCategoryButton}
        >
          {getIconName(type)}
        </IconButton>
      );
    })

    return (
      <div className={styles.fileCategoryButtonContainer}>
        <div className={styles.fileCategoryButtons}>
          {buttons}
        </div>
      </div>
    );
  }

  render() {
    const rootStyle = objectAssign({}, this.props.style);
    const controlButton = this.props.run.state === 'running'
      ? <RaisedButton label={this.props.intl.formatMessage(messages.stop)}
                      secondary={true}
                      onTouchTap={() => this.handleStop()}
        />
      : <RaisedButton label={this.props.intl.formatMessage(messages.run)}
                      primary={true}
                      onTouchTap={() => this.handleRun()}
        />;

    const editor = this.renderEditor();
    const instanceBrowser = this.renderInstanceBrowser();

    return (
      <div style={rootStyle}>
        <Layout flow="row" className={styles.content}>
          <LayoutContainer size={this.initialGameWidth} onResize={size => this.handleGameWidthResize(size)}>
            <Layout flow="column" className={styles.fillParent}>
              <LayoutContainer size={this.initialGameHeight} onResize={size => this.handleGameHeightResize(size)}>
                <ZonePreview gameState={this.props.studioState.gameState}
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
                {instanceBrowser}
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true}>
            {this.renderFileBrowserButtons()}
            <Layout flow="row" className={styles.editor}>
              <LayoutContainer
                hide={!this.state.fileBrowserOpen}
                size={this.initialBrowserWidth}
                onResize={size => this.handleFileBrowserWidthResize(size)}
              >
                {this.renderFileBrowser()}
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <div className={styles.fillParent}>
                  {editor}
                </div>
              </LayoutContainer>
            </Layout>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

interface StudioProps extends React.Props<Studio> {
  robotInstances: RobotInstance[];
  zoneInstances: ZoneInstance[];

  studioState: StudioState;
  onChange: (nextState: StudioState) => any;
  onOpenFileRequest: (fileType: FileType) => any;

  stateLayer: StateLayer;
  game?: React.ReactElement<any>;
  style?: React.CSSProperties;
}

interface StudioOwnState {
  mount?: boolean;
}

interface CreateStateOptions {
  codeEditorState?: CreateCodeEditorStateOptions;
  voxelEditorState?: CreateVoxelEditorStateOptions;
}

class Studio extends React.Component<StudioProps, StudioOwnState> {
  static creatState(options: CreateStateOptions = {}): StudioState {
    return {
      codeEditorState: CodeEditor.creatState(options.codeEditorState),
      gameState: ZonePreview.createState(),
      voxelEditorState: VoxelEditor.createState(options.voxelEditorState),
    };
  }

  constructor(props) {
    super(props);
    this.state = { mount: false };
  }

  componentDidMount() {
    this.setState({ mount: true });
  }

  componentWillUnmount() {
    this.setState({ mount: false });
  }

  render() {
    if (!this.state.mount) {
      return <div>Loading...</div>;
    }

    return (
      <StudioBody studioState={this.props.studioState}
                  robotInstances={this.props.robotInstances}
                  zoneInstances={this.props.zoneInstances}
                  onChange={this.props.onChange}
                  onOpenFileRequest={this.props.onOpenFileRequest}
                  stateLayer={this.props.stateLayer} style={this.props.style}
                  game={this.props.game || null}
      />
    );
  };
}

export default Studio;
