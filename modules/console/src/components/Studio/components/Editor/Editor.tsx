import * as React from 'react';
const update = require('react-addons-update');

import FileTabs from '../FileTabs';
import CodeEditor, { CodeEditorState } from '../../../../components/CodeEditor';
import VoxelEditor, { VoxelEditorState } from '../../../../components/VoxelEditor';
import RobotEditor, { RobotEditorState } from '../../../../components/RobotEditor';

import { FileType } from '../../types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Editor.css');

import { FileDescriptor, SourceFile, RobotState } from '../../types';

interface EditorState {
  codeEditorState?: CodeEditorState,
  voxelEditorState?: VoxelEditorState,
}

interface EditorProps extends React.Props<Editor> {
  file: SourceFile;
  files: { [index: string]: SourceFile };
  focus: boolean;
  editorSizeRevision: number;
  onFileChange: (fileId: string, state: any) => any;
}

@withStyles(styles)
class Editor extends React.Component<EditorProps, any> {
  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.file.state}
        onChange={this.props.onFileChange}
        sizeRevision={this.props.editorSizeRevision}
        readyToRender={true}
      />
    );
  }

  renderDesignEditor() {
    return (
      <VoxelEditor
        editorState={this.props.file.state}
        onChange={this.props.onFileChange}
        focus={this.props.focus}
        sizeVersion={this.props.editorSizeRevision}
      />
    );
  }

  renderRobotEditor() {
    return (
      <RobotEditor
        editorState={this.props.file.state}
        onChange={editorState => this.props.onFileChange(this.props.file.id, editorState)}
        files={this.props.files}
      />
    );
  }

  render() {
    let editor = null;

    if (this.props.file) {
      switch(this.props.file.type) {
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
      <div className={styles.addon}>{editor}</div>
    );
  }
}

export default Editor;
