import * as React from 'react';
const update = require('react-addons-update');

import FileTabs from '../FileTabs';
import CodeEditor, { CodeEditorState } from '../../../../components/CodeEditor';
import VoxelEditor, { VoxelEditorState } from '../../../../components/VoxelEditor';

import { FileType } from '../../types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Editor.css');

import { FileDescriptor } from '../../types';

interface EditorState {
  codeEditorState?: CodeEditorState,
  voxelEditorState?: VoxelEditorState,
}

interface EditorProps extends React.Props<Editor> {
  file: FileDescriptor;
  editorSizeRevision: number;

  // TODO: Replace with file body
  codeEditorState: CodeEditorState;
  voxelEditorState: VoxelEditorState;
  onStateChange: (state: EditorState) => any;
}

@withStyles(styles)
class Editor extends React.Component<EditorProps, any> {
  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.codeEditorState}
        onChange={codeEditorState => this.props.onStateChange({ codeEditorState })}
        sizeRevision={this.props.editorSizeRevision}
        readyToRender={true}
      />
    );
  }

  renderDesignEditor() {
    return (
      <VoxelEditor
        editorState={this.props.voxelEditorState}
        onChange={voxelEditorState => this.props.onStateChange({ voxelEditorState })}
        sizeVersion={this.props.editorSizeRevision}
        onSubmit={(data) => (data)}
      />
    );
  }

  renderRobotEditor() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div>
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
