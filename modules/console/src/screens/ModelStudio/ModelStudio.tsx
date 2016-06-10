import * as React from 'react';

import * as Immutable from 'immutable';

import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { RouteComponentProps } from 'react-router';
import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
import * as update from 'react-addons-update';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import ThumbnailFactory from '../../canvas/ThumbnailFactory';
import GeometryFactory from '../../canvas/GeometryFactory';

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
import { ModelFile, ModelFileMap, ModelFileOpenParams } from './types';

import ModelStudioNavbar from './components/ModelStudioNavbar';
import ModelStudioBody from './components/ModelStudioBody';
import OpenModelFileDialog from './components/OpenModelFileDialog';
import SaveDialog from './components/SaveDialog';

const styles = require('./ModelStudio.css');

import { saga, SagaProps, ImmutableTask, isRunning } from '../../saga';

import { updateFiles, updateFileMeta } from './sagas';

const saveAs: FileSaver = require('file-saver').saveAs;

interface RouteParams {
  username: string;
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  user?: User;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
  pushSnackbar?: (query: PushSnackbarQuery) => any;
  updateFiles?: ImmutableTask<any>;
  updateFileMeta?: ImmutableTask<any>;
}

interface HandlerState {
  sizeResivion?: number;
  modelCommonState?: ModelCommonState;
  files?: ModelFileMap;
  activeFileId?: string;
  openedFiles?: string[];
  openFileDialogOpen?: boolean;
  filesOnSaveDialog?: string[];
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
@saga({
  updateFiles,
  updateFileMeta,
})
class ModelStudioHandler extends React.Component<HandlerProps, HandlerState> {
  thumbnailFactory: ThumbnailFactory;
  geometryFactory: GeometryFactory;

  constructor(props) {
    super(props);

    this.geometryFactory = new GeometryFactory();

    this.state = {
      sizeResivion: 0,
      modelCommonState: ModelEditor.createCommonState(),
      files: Immutable.Map<string, ModelFile>(),
      activeFileId: '',
      openedFiles: [],
      openFileDialogOpen: false,
      filesOnSaveDialog: [],
    }
  }

  componentDidMount() {
    this.thumbnailFactory = new ThumbnailFactory(this.geometryFactory);
    this.handleNewFileButtonClick();
  }

  private addFile({
    id,
    name,
    body,
    created,
    readonly,
  }: ModelFileOpenParams) {
    const file: ModelFile = {
      id,
      name,
      thumbnail: this.thumbnailFactory.createThumbnail(body.present.data.model),
      type: FileType.MODEL,
      created,
      modified: false,
      readonly,
      savedBody: body,
      body,
      extra: ModelEditor.createExtraData(body.present.data.model.shape),
    };

    this.setState({
      openedFiles: [...this.state.openedFiles, file.id],
      activeFileId: file.id,
      files: this.state.files.set(id, file),
    });
  }

  handleFileStateChange = (body: ModelFileState) => {
    const currentFile = this.state.files.get(this.state.activeFileId);
    this.setState({
      files: this.state.files.set(this.state.activeFileId, Object.assign({}, currentFile, {
        body,
        modified: ModelEditor.isModified(currentFile.savedBody, body),
        thumbnail: this.thumbnailFactory.createThumbnail(body.present.data.model),
      }))
    });
  }

  handleNewFileButtonClick = () => {
    this.addFile({
      id: generateObjectId(),
      name: '',
      created: true,
      readonly: false,
      body: ModelEditor.createFileState(),
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

  private saveFile(fileList: string[]) {
    const newFiles: ModelFile[] = [];
    const oldFiles: ModelFile[] = [];

    const files = this.state.files.withMutations(files => {
      fileList.forEach(fileId => {
        const file = files.get(fileId);
        if (!file || (!file.created && !file.modified)) return;

        const thumbnail = this.thumbnailFactory.createThumbnail(file.body.present.data.model);
        const nextFile = Object.assign({}, file, { thumbnail });
        files.set(file.id, nextFile);

        if (nextFile.created) {
          newFiles.push(nextFile);
        } else if (nextFile.modified) {
          oldFiles.push(nextFile);
        }
      });
    });

    if (files !== this.state.files) this.setState({ files });

    if (newFiles.length > 0) {
      this.setState({
        filesOnSaveDialog: this.state.filesOnSaveDialog.concat(newFiles.map(file => file.id)),
      });
    }

    if (oldFiles.length > 0) {
      this.props.runSaga(this.props.updateFiles, this.thumbnailFactory, oldFiles, () => {
        const nextFiles = this.state.files.withMutations(files => {
          oldFiles.forEach(oldFile => {
            const file = files.get(oldFile.id);
            if (file) files.set(file.id, Object.assign({}, file, {
              savedBody: oldFile.body,
              modified: ModelEditor.isModified(oldFile.body, file.body),
            }));
          });
        });
        this.setState({ files: nextFiles });

        this.props.pushSnackbar({ message: `Successfully saved ${oldFiles.length} file(s)` });
      });
    }
  }

  handleSave = () => {
    const file = this.state.files.get(this.state.activeFileId);
    if (!file) return;
    this.saveFile([this.state.activeFileId]);
  }

  handleSaveAll = () => {
    this.saveFile(this.state.files.keySeq().toArray());
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

  handleRequestSaveDialogClose = (fileId: string) => {
    const index = this.state.filesOnSaveDialog.indexOf(fileId);
    if (index !== -1) {
      const filesOnSaveDialog = this.state.filesOnSaveDialog.slice();
      filesOnSaveDialog.splice(index, 1);
      this.setState({ filesOnSaveDialog });
    }
  }

  private updateFileName(fileId: string, name: string) {
    const file = this.state.files.get(fileId);
    this.setState({ files: this.state.files.set(fileId, Object.assign({}, file, { name })) });
  }

  handleFileRename = (fileId: string, name: string) => {
    const file = this.state.files.get(fileId);

    // Optimistic update
    this.updateFileName(fileId, name);

    if (file.created) return;

    this.props.runSaga(this.props.updateFileMeta, fileId, { name }, () => {
      // TODO: Error handling
    });
  }

  handleFileRemove = (fileId: string) => {
    this.handleFileClose(fileId);
    this.setState({ files: this.state.files.remove(fileId) });
  }

  isDialogOpen() {
    return (
         this.state.filesOnSaveDialog.length > 0
      || this.state.openFileDialogOpen
    );
  }

  handleFileOpen = (params: ModelFileOpenParams) => {
    this.addFile(params);
    this.setState({ openFileDialogOpen: false });
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

  handleFileSaveDone = (fileId: string, name: string) => {
    this.handleRequestSaveDialogClose(fileId);

    const file = this.state.files.get(fileId);
    if (!file) return;

    const fileUpdate = { created: false } as ModelFile;
    if (file.name !== name) fileUpdate.name = name;
    this.setState({
      files: this.state.files.set(fileId, Object.assign({}, file, fileUpdate)),
    })
  }

  render() {
    const fileOnSaveDialog = this.state.filesOnSaveDialog.length > 0
      ? this.state.files.get(this.state.filesOnSaveDialog[0])
      : null;

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
          onSaveAll={this.handleSaveAll}
        />
        <ModelStudioBody
          files={this.state.files}
          dialogOpen={this.isDialogOpen()}
          openedFiles={this.state.openedFiles}
          onRequestSnackbar={this.handleRequestSnackbar}
          activeFileId={this.state.activeFileId}
          geometryFactory={this.geometryFactory}
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
          user={this.props.user}
          open={this.state.openFileDialogOpen}
          onFileOpen={this.handleFileOpen}
          onRequestSnackbar={this.handleRequestSnackbar}
          onRequestClose={this.handleRequestOpenFileDialogClose}
        />
        <SaveDialog
          thumbnailFactory={this.thumbnailFactory}
          user={this.props.user}
          file={fileOnSaveDialog}
          onRequestClose={this.handleRequestSaveDialogClose}
          onSaveDone={this.handleFileSaveDone}
        />
      </div>
    );
  }
}

export default ModelStudioHandler;
