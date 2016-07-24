import * as React from 'react';

import * as Immutable from 'immutable';

import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { RouteComponentProps } from 'react-router';
const withRouter = require('react-router/lib/withRouter');
import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
import * as update from 'react-addons-update';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import snakeCase from 'snake-case';

import ThumbnailFactory from '../../canvas/ThumbnailFactory';
import GeometryFactory from '../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../canvas/TroveGeometryFactory';

import generateObjectId from '../../utils/generateObjectId';

import { moveToLoginPage } from '../../actions';
import { requestLogout } from '../../actions/auth';
import { pushSnackbar } from '../../actions/snackbar';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
  ModelSupportFileType,
} from '../../components/ModelEditor';
import itemType from '../../components/ModelEditor/trove/itemType';

import { State } from '../../reducers';
import { User } from '../../reducers/users';


import { FileType, ModelFileType, MaterialMapType } from '../../types';
import { ModelFile, ModelFileMap, ModelFileOpenParams, ModelFileDocument } from './types';

import ConfirmLeaveDialog from './components/ConfirmLeaveDialog';
import ModelStudioNavbar from './components/ModelStudioNavbar';
import ModelStudioBody from './components/ModelStudioBody';
import OpenModelFileDialog from './components/OpenModelFileDialog';
import DeleteFileDialog from './components/DeleteFileDialog';
import RemoveFileDialog from './components/RemoveFileDialog';
import SaveDialog from './components/SaveDialog';
import TruffyErrorDialog from './components/TruffyErrorDialog';

const styles = require('./ModelStudio.css');

import { saga, SagaProps, ImmutableTask, isRunning, isDone } from '../../saga';

import {
  updateFiles,
  updateFileMeta,
  deleteFile,
  openRemoteFiles,
  requestTruffyAction,
} from './sagas';

import {
  TruffyError,
  ACTION_INSTALL,
  ACTION_DOWNLOAD,
} from './truffy';

const saveAs: FileSaver = require('file-saver').saveAs;

interface RouteParams {
  username: string;
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  user?: User;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
  pushSnackbar?: typeof pushSnackbar;
  updateFiles?: ImmutableTask<any>;
  updateFileMeta?: ImmutableTask<any>;
  deleteFile?: ImmutableTask<any>;
  openRemoteFiles?: ImmutableTask<any>;
  requestTruffyAction?: ImmutableTask<TruffyError>;
  router?: any;
  moveToLoginPage?: typeof moveToLoginPage;
}

interface LeaveConfirmParams {
  logout: boolean;
  location: any;
}

interface HandlerState {
  sizeResivion?: number;
  modelCommonState?: ModelCommonState;
  files?: ModelFileMap;
  activeFileId?: string;
  openedFiles?: string[];
  openFileDialogOpen?: boolean;
  filesOnSaveDialog?: string[];
  leaveConfirmParams?: LeaveConfirmParams;
  fileToDelete?: string;
  fileToRemove?: string;
}

@withStyles(styles)
@(DragDropContext(HTML5Backend) as any)
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
  pushSnackbar,
  moveToLoginPage,
}) as any)
@saga({
  updateFiles,
  updateFileMeta,
  deleteFile,
  openRemoteFiles,
  requestTruffyAction,
})
@withRouter
class ModelStudioHandler extends React.Component<HandlerProps, HandlerState> {
  static contextTypes = {
    isMac: React.PropTypes.bool.isRequired,
  };

  thumbnailFactory: ThumbnailFactory;
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;

  oldBeforeUnload: any;

  leaveConfirmed: boolean;

  isMac: boolean;

  constructor(props, context) {
    super(props, context);

    this.isMac = context.isMac;

    this.leaveConfirmed = false;

    this.geometryFactory = new GeometryFactory();
    this.troveGeometryFactory = new TroveGeometryFactory();

    this.state = {
      sizeResivion: 0,
      modelCommonState: ModelEditor.createCommonState(),
      files: Immutable.Map<string, ModelFile>(),
      activeFileId: '',
      openedFiles: [],
      openFileDialogOpen: false,
      filesOnSaveDialog: [],
      leaveConfirmParams: null,
      fileToDelete: '',
      fileToRemove: '',
    }
  }

  unsavedChangeExists() {
    const files = this.state.files.toArray();
    for (let i = 0, len = files.length; i < len; ++i) {
      const file = files[i];
      if (file.created || file.modified) return true;
    }
    return false;
  }

  componentDidMount() {
    this.thumbnailFactory = new ThumbnailFactory(this.geometryFactory, this.troveGeometryFactory);

    this.props.router.setRouteLeaveHook(this.props.route, location => {
      if (this.leaveConfirmed) return true;

      if (this.unsavedChangeExists()) {
        this.setState({ leaveConfirmParams: { logout: false, location } });
        return false;
      }

      return true;
    });

    this.oldBeforeUnload = window.onbeforeunload;
    window.onbeforeunload = () => this.unsavedChangeExists()
      ? 'Unsaved changes will be lost' : undefined;

    const filesQuery = this.props.location.query['files'];
    if (!filesQuery) return;
    const files = filesQuery.split(',');

    this.props.runSaga(this.props.openRemoteFiles, files, results => {
      results.forEach(result => this.openFile(result.doc, result.fileState));
    });

    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  componentWillUnmount() {
    this.thumbnailFactory.dispose();
    window.onbeforeunload = this.oldBeforeUnload;
    document.removeEventListener('keydown', this.handleKeyDown, false);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
        // CTRL or COMMAND

        switch(e.keyCode) {
          case 66: // B
          {
            e.preventDefault();
            this.handleInstallBlueprintRequest();
            break;
          }
          case 83: // S
          {
            e.preventDefault();
            this.handleSave();
            break;
          }
      }
    }
  }

  openFile(doc: ModelFileDocument, fileState: ModelFileState) {
    if (doc.owner && this.props.user && doc.owner.id === this.props.user.id) {
      this.addFile({
        id: doc.id,
        owner: this.props.user || null,
        name: doc.name,
        created: false,
        readonly: false,
        body: fileState,
        forkParent: doc.forkParent || null,
      });
    } else {
      this.addFile({
        id: generateObjectId(),
        owner: this.props.user || null,
        name: doc.name,
        created: true,
        readonly: false,
        body: fileState,
        forkParent: {
          id: doc.id,
          name: doc.name,
          owner: doc.owner || null,
        },
      });
    }
  }

  private addFile({
    id,
    name,
    owner,
    body,
    created,
    readonly,
    forkParent,
  }: ModelFileOpenParams) {
    const model = body.present.data.maps[MaterialMapType.DEFAULT];
    const file: ModelFile = {
      id,
      name,
      owner,
      thumbnail: this.thumbnailFactory.createThumbnail(body.present.data),
      type: FileType.MODEL,
      created,
      modified: false,
      readonly,
      savedBody: body,
      body,
      extra: ModelEditor.createExtraData(model.shape),
      forkParent,
    };

    const openedFiles = this.state.openedFiles.indexOf(file.id) === -1
      ? [...this.state.openedFiles, file.id]
      : this.state.openedFiles;

    this.setState({
      openedFiles,
      activeFileId: file.id,
      files: this.state.files.set(id, file),
    });
  }

  handleFileStateChange = (body: ModelFileState) => {
    const model = body.present.data.maps[MaterialMapType.DEFAULT];
    const currentFile = this.state.files.get(this.state.activeFileId);
    this.setState({
      files: this.state.files.set(this.state.activeFileId, Object.assign({}, currentFile, {
        body,
        modified: ModelEditor.isModified(currentFile.savedBody, body),
        thumbnail: this.thumbnailFactory.createThumbnail(body.present.data),
      }))
    });
  }

  handleNewFileButtonClick = () => {
    this.addFile({
      id: generateObjectId(),
      name: '',
      owner: this.props.user || null,
      created: true,
      readonly: false,
      body: ModelEditor.createFileState(),
      forkParent: null,
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

    fileList.forEach(fileId => {
      const file = this.state.files.get(fileId);
      if (!file || (!file.created && !file.modified)) return;

      if (file.created) {
        newFiles.push(file);
      } else {
        oldFiles.push(file);
      }
    });

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

  removeFileFromList(fileId: string) {
    this.handleFileClose(fileId);
    this.setState({ files: this.state.files.remove(fileId) });
  }

  handleRequestFileRemove = (fileId: string) => {
    const file = this.state.files.get(fileId);
    if (!file) return;

    if (!this.props.user || file.created || file.modified) {
      this.setState({ fileToRemove: fileId });
    } else {
      this.removeFileFromList(fileId);
    }
  }

  handleFileRemove = () => {
    this.removeFileFromList(this.state.fileToRemove);
  }

  handleCancelFileRemove = () => this.setState({ fileToRemove: '' });

  handleRequestFileDelete = (fileId: string) => this.setState({ fileToDelete: fileId })

  handleCancelFileDelete = () => this.setState({ fileToDelete: '' });

  handleFileDelete = () => {
    if (!this.state.fileToDelete) return;

    const fileId = this.state.fileToDelete;
    this.props.runSaga(this.props.deleteFile, fileId, () => {
      this.setState({ fileToDelete: '' });
      this.removeFileFromList(fileId);
    });
  }

  handleFileOpen = (params: ModelFileOpenParams) => {
    this.addFile(params);
    this.setState({ openFileDialogOpen: false });
  }

  handleFileDownload = (fileType: ModelSupportFileType) => {
    const file = this.state.files.get(this.state.activeFileId);
    if (!file) return;

    const username = this.props.user && this.props.user.username || 'anonymous';
    const filename = file.name || 'untitled';

    switch(fileType) {
      case ModelSupportFileType.MAGICA_VOXEL: {
        ModelEditor.exportVoxFile(file.body, filename, username)
          .then(({ extension, data }) => saveAs(new Blob([data]), `${file.name || 'untitled'}.${extension}`, true))
          .catch(error => this.props.pushSnackbar({ message: `Export file failed: ${error}` }));
        return;
      }
      case ModelSupportFileType.QUBICLE: {
        ModelEditor.exportQbFile(file.body, filename, username)
          .then(({ extension, data }) => saveAs(new Blob([data]), `${file.name || 'untitled'}.${extension}`, true))
          .catch(error => this.props.pushSnackbar({ message: `Export file failed: ${error}` }));
        return;
      }
    }
  }

  handleFileSaveDone = (fileId: string, name: string) => {
    this.handleRequestSaveDialogClose(fileId);

    const file = this.state.files.get(fileId);
    if (!file) return;

    const fileUpdate = { created: false, modified: false } as ModelFile;
    if (file.name !== name) fileUpdate.name = name;

    this.setState({
      files: this.state.files.set(fileId, Object.assign({}, file, fileUpdate)),
    });
  }

  handleConfirmLeaveDialogClose = () => {
    this.setState({ leaveConfirmParams: null });
  }

  handleLeaveConfirm = () => {
    if (!this.state.leaveConfirmParams) return;

    this.leaveConfirmed = true;
    if (this.state.leaveConfirmParams.logout) {
      this.props.requestLogout();
    } else {
      this.props.push(this.state.leaveConfirmParams.location);
    }
  }

  handleLoginFromRemoveDialog = () => {
    this.handleCancelFileRemove();
    this.props.moveToLoginPage(this.props.location);
  }

  handleLogout = () => {
    if (this.unsavedChangeExists()) {
      this.setState({ leaveConfirmParams: { logout: true, location: null } });
    } else {
      this.props.requestLogout();
    }
  }

  handleEditAsTroveFile = () => {
    const currentFile = this.state.files.get(this.state.activeFileId);
    if (!currentFile) return;

    this.handleFileStateChange(ModelEditor.editAsTrove(currentFile.body));
  }

  handleGetLink = () => {
    const currentFile = this.state.files.get(this.state.activeFileId);
    if (!currentFile) return;

    if (currentFile.created) {
      this.props.pushSnackbar({
        message: 'Model should be saved to get a link.',
      });
      return;
    }

    window.open(`/model/${currentFile.id}`, '_blank');
  }

  installBlueprint(file: ModelFile) {
    if (file.body.present.data.type !== ModelFileType.TROVE) return;

    const username = this.props.user && this.props.user.username || 'anonymous';
    const filename = file.name || 'untitled';

    const snakeCased = snakeCase(filename) || 'mesh';

    // Build snackbar message
    const messages = [
      <span key={0}>
        <span>Blueprint </span><span className={styles.bold}>{filename}</span><span> successfully installed.</span>
      </span>
    ];

    const commands = itemType[file.body.present.data.trove.itemType].commands.map(cmd => `/${cmd} ${snakeCased}`);

    {
      if (commands.length > 0) {
        const copyCommand = this.isMac ? 'control+V' : 'Ctrl+V';
        const finalCommands = commands.map(cmd => `${cmd}`).concat([copyCommand]);

        let keyidx = 0;
        const commandMessages = [<span key={keyidx++} className={styles.bold}>{finalCommands[0]}</span>];
        for (let i = 1, len = finalCommands.length - 1; i < len; ++i) {
          commandMessages.push(<span key={keyidx++}>, </span>);
          commandMessages.push(<span key={keyidx++} className={styles.bold}>{finalCommands[i]}</span>);
        }
        commandMessages.push(<span key={keyidx++}> or </span>);
        commandMessages.push(<span key={keyidx++} className={styles.bold}>{finalCommands[finalCommands.length - 1]}</span>);

        messages.push(
          <span key={1}>
            <span> Type </span>{commandMessages}<span> in game chat.</span>
          </span>
        );
      }
    }

    // TODO: Change message on Safari. Clipboard.js does not support Safari.
    this.props.runSaga(
      this.props.requestTruffyAction, ACTION_INSTALL, file, username, snakeCased, commands[0] || '',
      () => this.props.pushSnackbar({
        message: <span>{messages}</span> as any,
        bodyStyle: {
          lineHeight: '20px',
          padding: '10px 24px',
          height: 'inherit',
        },
        timeout: 7000,
      })
    );
  }

  handleInstallBlueprintRequest = () => {
    const file = this.state.files.get(this.state.activeFileId);
    if (!file) return;

    this.installBlueprint(file);
  }

  downloadBlueprint(file: ModelFile) {
    if (file.body.present.data.type !== ModelFileType.TROVE) return;

    const username = this.props.user && this.props.user.username || 'anonymous';
    const filename = file.name || 'untitled';

    const snakeCased = snakeCase(filename) || 'mesh';

    // TODO: Change message on Safari. Clipboard.js does not support Safari.
    this.props.runSaga(
      this.props.requestTruffyAction, ACTION_DOWNLOAD, file, username, snakeCased, '',
      (data: ArrayBuffer) => saveAs(new Blob([data]), `${snakeCased}.blueprint`, true)
    );
  }

  handleDownloadBlueprintRequest = () => {
    const file = this.state.files.get(this.state.activeFileId);
    if (!file) return;

    this.downloadBlueprint(file);
  }

  handleInstallBlueprintRetry = (file: ModelFile, action: string) => {
    switch(action) {
      case ACTION_INSTALL: {
        return this.installBlueprint(file);
      }
      case ACTION_DOWNLOAD: {
        return this.downloadBlueprint(file);
      }
    }
  }

  handleInstallBlueprintDialogClose = () => {
    this.props.cancelSaga(this.props.requestTruffyAction);
  }

  render() {
    const fileOnSaveDialog = this.state.filesOnSaveDialog.length > 0
      ? this.state.files.get(this.state.filesOnSaveDialog[0])
      : null;

    const file = this.state.files.get(this.state.activeFileId);

    return (
      <div>
        <ModelStudioNavbar
          file={file}
          location={this.props.location}
          user={this.props.user}
          onGetLink={this.handleGetLink}
          onLinkClick={this.props.push}
          onLogout={this.handleLogout}
          onRequestOpenFile={this.handleRequestOpenFile}
          onNewFile={this.handleNewFileButtonClick}
          onDownload={this.handleFileDownload}
          onEditAsTroveFile={this.handleEditAsTroveFile}
          onInstallBlueprint={this.handleInstallBlueprintRequest}
          onDownloadBlueprint={this.handleDownloadBlueprintRequest}
          onSave={this.handleSave}
          onSaveAll={this.handleSaveAll}
        />
        <ModelStudioBody
          userId={this.props.user && this.props.user.id}
          files={this.state.files}
          openedFiles={this.state.openedFiles}
          onRequestSnackbar={this.handleRequestSnackbar}
          activeFileId={this.state.activeFileId}
          geometryFactory={this.geometryFactory}
          troveGeometryFactory={this.troveGeometryFactory}
          onFileCreate={this.handleNewFileButtonClick}
          onFileChange={this.handleFileStateChange}
          onFileClick={this.handleFileClick}
          onFileRemove={this.handleRequestFileRemove}
          onFileDelete={this.handleRequestFileDelete}
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
        <ConfirmLeaveDialog
          open={!!this.state.leaveConfirmParams}
          onRequestClose={this.handleConfirmLeaveDialogClose}
          onLeaveConfirm={this.handleLeaveConfirm}
        />
        <RemoveFileDialog
          loggedIn={!!this.props.user}
          fileToRemove={this.state.files.get(this.state.fileToRemove)}
          onLogIn={this.handleLoginFromRemoveDialog}
          onRemoveCancel={this.handleCancelFileRemove}
          onRemoveConfirm={this.handleFileRemove}
        />
        <DeleteFileDialog
          disabled={isRunning(this.props.deleteFile)}
          fileToDelete={this.state.files.get(this.state.fileToDelete)}
          onDeleteCancel={this.handleCancelFileDelete}
          onDeleteConfirm={this.handleFileDelete}
        />
        <TruffyErrorDialog
          error={isDone(this.props.requestTruffyAction) &&  this.props.requestTruffyAction.result}
          onRequestClose={this.handleInstallBlueprintDialogClose}
          onRetry={this.handleInstallBlueprintRetry}
        />
      </div>
    );
  }
}

export default ModelStudioHandler;
