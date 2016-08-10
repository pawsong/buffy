import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import Badge from 'material-ui/Badge';
import * as Colors from 'material-ui/styles/colors';

import PlayArrow from 'material-ui/svg-icons/av/play-arrow';
import Palette from 'material-ui/svg-icons/image/palette';

import Layout, { LayoutContainer } from '../../../../components/Layout';
import FileMultiple from '../../../../components/icons/FileMultiple';
import { getFileTypeLabel, getFileTypeAvatar } from '../../../../utils/file';

import { ModelFile, ModelFileMap, EditorMode } from '../../types';

const styles = require('../../ModelStudio.css');

import FileList from './FileList';

interface FileBrowserProps extends React.Props<FileBrowser> {
  userId: string;
  activeFile: ModelFile;
  initialWidth: number;
  onWidthResize: (size: number) => any;
  files: ModelFileMap;
  open: boolean;
  onRequestOpen: (open: boolean) => any;
  onFileClick: (fileId: string) => any;
  onRequestRename: (fileId: string) => any;
  onFileRename: (fileId: string, name: string) => any;
  onFileRemove: (fileId: string) => any;
  onFileDelete: (fileId: string) => any;
  editorMode: EditorMode;
  onChangeEditorMode: (mode: EditorMode) => any;
  renameFileId: string;
}

interface FileBrowserState {
  haveUsedAnimationEditor: boolean;
}

class FileBrowser extends React.Component<FileBrowserProps, FileBrowserState> {
  constructor(props: FileBrowserProps) {
    super(props);
    this.state = {
      haveUsedAnimationEditor: !!localStorage.getItem('noti.have.used.animation.editor'),
    };
  }

  toggleFileBrowser = () => this.props.onRequestOpen(!this.props.open);

  handleSelectDrawMode = () => this.props.onChangeEditorMode(EditorMode.DRAW);

  handleSelectAnimateMode = () => {
    if (!this.state.haveUsedAnimationEditor) {
      this.setState({ haveUsedAnimationEditor: true }, () => {
        localStorage.setItem('noti.have.used.animation.editor', 'true');
      });
    }
    this.props.onChangeEditorMode(EditorMode.ANIMATE);
  }

  renderFileBrowserButtons() {
    return (
      <div className={styles.fileCategoryButtonContainer}>
        <div className={styles.fileCategoryButtons}>
          {this.state.haveUsedAnimationEditor ? this.renderAnimationButton() : (
            <Badge
              badgeContent={'new'}
              primary={true}
              style={{padding: 0}}
              badgeStyle={{
                fontSize: '9px',
                width: 20,
                height: 20,
              }}
            >
              {this.renderAnimationButton()}
            </Badge>
          )}
          <IconButton
            tooltip={'Draw'}
            onTouchTap={this.handleSelectDrawMode}
            className={styles.fileCategoryButton}
            disabled={!this.props.activeFile}
          >
            <Palette
              color={this.props.editorMode === EditorMode.DRAW ? Colors.black : Colors.grey500}
            />
          </IconButton>
          <IconButton
            tooltip={'Files'}
            onTouchTap={this.toggleFileBrowser}
            className={styles.fileCategoryButton}
          >
            <FileMultiple
              color={this.props.open ? Colors.black : Colors.grey500}
            />
          </IconButton>
        </div>
      </div>
    );
  }

  renderAnimationButton() {
    return (
      <IconButton
        tooltip={'Animate'}
        onTouchTap={this.handleSelectAnimateMode}
        className={styles.fileCategoryButton}
        iconStyle={{
          transform: `scale(1.32) ${this.state.haveUsedAnimationEditor ? '' : 'translateX(-2px)'}`,
        }}
        disabled={!this.props.activeFile}
      >
        <PlayArrow
          color={this.props.editorMode === EditorMode.ANIMATE ? Colors.black : Colors.grey500}
        />
      </IconButton>
    );
  }

  renderFileBrowser() {
    if (!this.props.open) return null;

    return (
      <div>
        <FileList
          userId={this.props.userId}
          files={this.props.files}
          renameFileId={this.props.renameFileId}
          onFileTouchTap={this.props.onFileClick}
          onRequestRename={this.props.onRequestRename}
          onFileRename={this.props.onFileRename}
          onFileRemove={this.props.onFileRemove}
          onFileDelete={this.props.onFileDelete}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderFileBrowserButtons()}
        <Layout flow="row" className={styles.editor}>
          <LayoutContainer
            hide={!this.props.open}
            size={this.props.initialWidth}
            onResize={this.props.onWidthResize}
          >
            {this.renderFileBrowser()}
          </LayoutContainer>
          <LayoutContainer remaining={true}>
            <div className={styles.fillParent}>
              {this.props.children}
            </div>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

export default FileBrowser;
