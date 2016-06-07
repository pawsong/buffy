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
} from '../../components/ModelEditor';

import { State } from '../../reducers';
import { User } from '../../reducers/users';

import { FileType } from '../../types';
import { ModelFile, ModelFileMap } from './types';

import ModelStudioNavbar from './components/ModelStudioNavbar';
import ModelStudioBody from './components/ModelStudioBody';

const styles = require('./ModelStudio.css');

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
    console.log('handle save');
  }

  handleRequestSnackbar = (message: string) => this.props.pushSnackbar({ message });

  render() {
    return (
      <div>
        <ModelStudioNavbar
          location={this.props.location}
          user={this.props.user}
          onLinkClick={this.props.push}
          onLogout={this.props.requestLogout}
          onNewFile={this.handleNewFileButtonClick}
          onSave={this.handleSave}
        />
        <ModelStudioBody
          files={this.state.files}
          openedFiles={this.state.openedFiles}
          onRequestSnackbar={this.handleRequestSnackbar}
          activeFileId={this.state.activeFileId}
          onFileCreate={this.handleNewFileButtonClick}
          onFileChange={this.handleFileStateChange}
          onFileClick={this.handleFileClick}
          onFileClose={this.handleFileClose}
          onOpenedFileOrderChange={this.handleFileTabOrderChange}
        />
      </div>
    );
  }
}

export default ModelStudioHandler;
