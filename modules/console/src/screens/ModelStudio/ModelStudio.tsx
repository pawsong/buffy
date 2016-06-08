import * as React from 'react';

import * as Immutable from 'immutable';

import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { RouteComponentProps } from 'react-router';
import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
import * as update from 'react-addons-update';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import generateObjectId from '../../utils/generateObjectId';

import { requestLogout } from '../../actions/auth';
import { pushSnackbar, PushSnackbarQuery } from '../../actions/snackbar';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
  ModelSupportFileType,
} from '../../components/ModelEditor';

import { State } from '../../reducers';
import { User } from '../../reducers/users';

import { FileType } from '../../types';
import { ModelFile, ModelFileMap } from './types';

import ModelStudioNavbar from './components/ModelStudioNavbar';
import ModelStudioBody from './components/ModelStudioBody';
import OpenModelFileDialog from './components/OpenModelFileDialog';

const styles = require('./ModelStudio.css');

const saveAs: FileSaver = require('file-saver').saveAs;

interface RouteParams {
  username: string;
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
  user?: User;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
  pushSnackbar?: (query: PushSnackbarQuery) => any;

}

interface HandlerState {
  sizeResivion?: number;
  modelCommonState?: ModelCommonState;
  files?: ModelFileMap;
  activeFileId?: string;
  openedFiles?: string[];
  openFileDialogOpen?: boolean;
}

@withStyles(styles)
@(DragDropContext(HTML5Backend) as any)
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
  pushSnackbar,
}) as any)
class ModelStudioHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);

    const file = this.createFile();

    this.state = {
      sizeResivion: 0,
      modelCommonState: ModelEditor.createCommonState(),
      files: Immutable.Map<string, ModelFile>({ [file.id]: file }),
      activeFileId: file.id,
      openedFiles: [file.id],
      openFileDialogOpen: false,
    }
  }

  handleFileStateChange = (body: ModelFileState) => {
    const currentFile = this.state.files.get(this.state.activeFileId);
    this.setState({
      files: this.state.files.set(this.state.activeFileId, Object.assign({}, currentFile, {
        body,
        modified: ModelEditor.isModified(currentFile.savedBody, body),
      }))
    });
  }

  private createFile(): ModelFile {
    const id = generateObjectId();
    const body = ModelEditor.createFileState();
    const extra = ModelEditor.createExtraData(body.present.data.size);

    return {
      id,
      name: '',
      type: FileType.MODEL,
      created: true,
      modified: false,
      readonly: false,
      savedBody: body,
      body,
      extra,
    };
  }

  handleNewFileButtonClick = () => {
    const file = this.createFile();
    this.setState({
      files: this.state.files.set(file.id, file),
      activeFileId: file.id,
      openedFiles: [...this.state.openedFiles, file.id],
    });
  }

  handleFileTabOrderChange = (dragIndex: number, hoverIndex: number) => {
    const dragId = this.state.openedFiles[dragIndex];
    this.setState(update(this.state, {
      openedFiles: {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragId],
        ],
      },
    }));
  }

  handleFileClick = (fileId: string) => {
    if (this.state.openedFiles.indexOf(fileId) === -1) {
      this.setState({
        activeFileId: fileId,
        openedFiles: [...this.state.openedFiles, fileId],
      });
    } else {
      this.setState({ activeFileId: fileId });
    }
  }

  handleFileClose = (fileId: string) => {
    const idx = this.state.openedFiles.indexOf(fileId);
    if (idx === -1) return;

    const openedFiles = this.state.openedFiles.slice();
    openedFiles.splice(idx, 1);

    let activeFileId: string;

    if (openedFiles.length === 0) {
      activeFileId = '';
    } else {
      if (fileId === this.state.activeFileId) {
        if (idx < this.state.openedFiles.length - 1) {
          activeFileId = this.state.openedFiles[idx + 1];
        } else if (idx > 0) {
          activeFileId = this.state.openedFiles[idx - 1];
        } else {
          activeFileId = '';
        }
      } else {
        activeFileId = this.state.activeFileId;
      }
    }

    this.setState({
      openedFiles,
      activeFileId,
    });
  }

  handleSave = () => {
    const b = this.state.files.filter(a => a.created || a.modified).toArray();
    console.log(b);
  }

  handleRequestSnackbar = (message: string) => this.props.pushSnackbar({ message });

  handleRequestOpenFile = () => {
    if (this.state.openFileDialogOpen) return;
    this.setState({ openFileDialogOpen: true });
  };

  handleRequestOpenFileDialogClose = () => {
    if (!this.state.openFileDialogOpen) return;
    this.setState({ openFileDialogOpen: false });
  }

  handleFileRename = (fileId: string, name: string) => {
    const file = this.state.files.get(fileId);
    this.setState({
      files: this.state.files.set(fileId, Object.assign({}, file, { name })),
    });
  }

  handleFileRemove = (fileId: string) => {
    this.handleFileClose(fileId);
    this.setState({ files: this.state.files.remove(fileId) });
  }

  isDialogOpen() {
    return this.state.openFileDialogOpen;
  }

  handleFileOpen = (fileState: ModelFileState) => {
    const id = generateObjectId();
    const extra = ModelEditor.createExtraData(fileState.present.data.model.shape);
    const file: ModelFile = {
      id,
      name: '',
      type: FileType.MODEL,
      created: true,
      modified: false,
      readonly: false,
      savedBody: fileState,
      body: fileState,
      extra,
    };

    this.setState({
      openFileDialogOpen: false,
      openedFiles: [...this.state.openedFiles, file.id],
      activeFileId: file.id,
      files: this.state.files.set(id, file),
    })
  }

  handleFileDownload = (fileType: ModelSupportFileType) => {
    const file = this.state.files.get(this.state.activeFileId);
    if (!file) return;

    switch(fileType) {
      case ModelSupportFileType.MAGICA_VOXEL: {
        const { error, result } = ModelEditor.exportVoxFile(file.body);
        if (error) {
          this.props.pushSnackbar({ message: `Export file failed: ${error}` });
        } else {
          saveAs(new Blob([result]), `${file.name || 'untitled'}.vox`, true);
        }
        return;
      }
    }
  }

  render() {
    return (
      <div>
        <ModelStudioNavbar
          location={this.props.location}
          user={this.props.user}
          onLinkClick={this.props.push}
          onLogout={this.props.requestLogout}
          onRequestOpenFile={this.handleRequestOpenFile}
          onNewFile={this.handleNewFileButtonClick}
          onDownload={this.handleFileDownload}
          onSave={this.handleSave}
        />
        <ModelStudioBody
          files={this.state.files}
          dialogOpen={this.isDialogOpen()}
          openedFiles={this.state.openedFiles}
          onRequestSnackbar={this.handleRequestSnackbar}
          activeFileId={this.state.activeFileId}
          onFileCreate={this.handleNewFileButtonClick}
          onFileChange={this.handleFileStateChange}
          onFileClick={this.handleFileClick}
          onFileRemove={this.handleFileRemove}
          onFileClose={this.handleFileClose}
          onFileRename={this.handleFileRename}
          onRequestOpenFile={this.handleRequestOpenFile}
          onOpenedFileOrderChange={this.handleFileTabOrderChange}
        />
        <OpenModelFileDialog
          open={this.state.openFileDialogOpen}
          onFileOpen={this.handleFileOpen}
          onRequestSnackbar={this.handleRequestSnackbar}
          onRequestClose={this.handleRequestOpenFileDialogClose}
        />
      </div>
    );
  }
}

export default ModelStudioHandler;
