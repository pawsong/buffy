import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { defineMessages } from 'react-intl';
import FontIcon from 'material-ui/FontIcon';
import { pink200, green300, blue300 } from 'material-ui/styles/colors';

import GeometryFactory from '../../../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../../../canvas/TroveGeometryFactory';

import LargeImageButton from './LargeImageButton';
import waitForMount from '../../../../components/waitForMount';
import Messages from '../../../../constants/Messages';
import FileMultiple from '../../../../components/icons/FileMultiple';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../../../components/ModelEditor';

import { ModelFile, ModelFileMap } from '../../types';

const styles = require('../../ModelStudio.css');

import FileBrowser from './FileBrowser';
import FileTabs from './FileTabs';

const NAVBAR_HEIGHT = 56;
const TABS_HEIGHT = 33;

const messages = defineMessages({
  createNewFile: {
    id: 'modelstudio.createNewFile',
    description: 'Create new file',
    defaultMessage: 'Create New File',
  },
  openFileFromWorkingList: {
    id: 'modelstudio.openFileFromWorkingList',
    description: 'Choose file from working list',
    defaultMessage: 'Choose File from List',
  },
  openFileFromRemoteStore: {
    id: 'modelstudio.openFileFromRemoteStore',
    description: 'Open file from remote store',
    defaultMessage: 'Open File',
  },
});

const inlineStyles = {
  root: {
    position: 'fixed',
    top: NAVBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
  editor: {
    position: 'absolute',
    top: TABS_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

interface ModelStudioBodyProps {
  userId: string;
  files: ModelFileMap;
  activeFileId: string;
  onFileChange: (body: ModelFileState) => any;
  openedFiles: string[];
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;
  onFileCreate: () => any;
  onFileClick: (fileId: string) => any;
  onFileRemove: (fileId: string) => any;
  onFileDelete: (fileId: string) => any;
  onFileClose: (fileId: string) => any;
  onFileRename: (fileId: string, name: string) => any;
  onRequestOpenFile: () => any;
  onRequestSnackbar: (message: string) => any;
  onOpenedFileOrderChange: (dragIndex: number, hoverIndex: number) => any;
}

interface HandlerState {
  editorSizeResivion?: number;
  modelCommonState?: ModelCommonState;
  browserOpen?: boolean;
  renameFileId?: string;
  focused?: boolean;
}

const LS_KEY_BROWSER_WIDTH = 'modelstudio.browser.width';

@waitForMount
class ModelStudioBody extends React.Component<ModelStudioBodyProps, HandlerState> {
  private initialBrowserWidth: number;

  constructor(props) {
    super(props);

    const activeFile = this.props.files.get(this.props.activeFileId);

    this.initialBrowserWidth = parseInt(localStorage.getItem(LS_KEY_BROWSER_WIDTH) || 300, 10);

    this.state = {
      editorSizeResivion: 0,
      modelCommonState: ModelEditor.createCommonState(),
      browserOpen: false,
      renameFileId: '',
      focused: false,
    };
  }

  handleCommonStateChange = (modelCommonState: ModelCommonState) => this.setState({ modelCommonState });

  handleBrowserOpen = () => {
    if (this.state.browserOpen) {
      this.props.onRequestSnackbar('Working list is already open on left side. Choose one :)');
    } else {
      this.setState({ browserOpen: true });
    }
  }

  renderGetFileButtons() {
    return (
      <div className={styles.guideWhenNoFileOpened}>
        <LargeImageButton
          label={messages.createNewFile}
          onTouchTap={this.props.onFileCreate}
          backgroundColor={pink200}
        >
          <FontIcon className="material-icons" style={{ fontSize: 150 }}>note_add</FontIcon>
        </LargeImageButton>
        <LargeImageButton
          label={messages.openFileFromWorkingList}
          onTouchTap={this.handleBrowserOpen}
          backgroundColor={green300}
        >
          <FileMultiple style={{ width: 130, height: 130 }} />
        </LargeImageButton>
        <LargeImageButton
          label={messages.openFileFromRemoteStore}
          onTouchTap={this.props.onRequestOpenFile}
          backgroundColor={blue300}
        >
          <FontIcon className="material-icons" style={{ fontSize: 150 }}>cloud_download</FontIcon>
        </LargeImageButton>
      </div>
    );
  }

  renderEditor(activeFile: ModelFile) {
    const files = this.props.openedFiles.map(id => this.props.files.get(id));

    return (
      <div>
        <FileTabs
          onFileClick={this.props.onFileClick}
          activeFileId={this.props.activeFileId}
          files={files}
          onFileClose={this.props.onFileClose}
          onTabOrderChange={this.props.onOpenedFileOrderChange}
        />
        <div style={inlineStyles.editor}>
          <ModelEditor
            geometryFactory={this.props.geometryFactory}
            troveGeometryFactory={this.props.troveGeometryFactory}
            sizeVersion={this.state.editorSizeResivion}
            commonState={this.state.modelCommonState}
            fileState={activeFile.body}
            extraData={activeFile.extra}
            onCommonStateChange={this.handleCommonStateChange}
            onFileStateChange={this.props.onFileChange}
          />
        </div>
      </div>
    );
  }

  resizeEditor = () => this.setState({ editorSizeResivion: this.state.editorSizeResivion + 1 })

  handleBrowserWidthResize = (width: number) => {
    this.resizeEditor();
    localStorage.setItem(LS_KEY_BROWSER_WIDTH, '' + width);
  }

  handleBrowserRequestOpen = (open: boolean) => {
    if (this.state.browserOpen === open) return;
    this.setState({ browserOpen: open }, this.resizeEditor);
  }

  handleRequestFileRename = (fileId: string) => {
    this.setState({ renameFileId: fileId });
  }

  handleFileRename = (fileId: string, name: string) => {
    this.props.onFileRename(fileId, name);
    this.handleRequestFileRename('');
  }

  render() {
    const activeFile = this.props.files.get(this.props.activeFileId);

    return (
      <div style={inlineStyles.root}>
        <FileBrowser
          userId={this.props.userId}
          onFileClick={this.props.onFileClick}
          onRequestRename={this.handleRequestFileRename}
          onFileRename={this.handleFileRename}
          onFileRemove={this.props.onFileRemove}
          onFileDelete={this.props.onFileDelete}
          files={this.props.files}
          initialWidth={this.initialBrowserWidth}
          onWidthResize={this.handleBrowserWidthResize}
          open={this.state.browserOpen}
          onRequestOpen={this.handleBrowserRequestOpen}
          renameFileId={this.state.renameFileId}
        >
          {activeFile ? this.renderEditor(activeFile) : this.renderGetFileButtons()}
        </FileBrowser>
      </div>
    );
  }
}

export default ModelStudioBody;
