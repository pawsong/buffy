import * as React from 'react';
const update = require('react-addons-update');

import FileTabs from '../FileTabs';
import CodeEditor, { CodeEditorState } from '../../../../components/CodeEditor';
import VoxelEditor, { VoxelEditorState } from '../../../../components/VoxelEditor';

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
  editorSizeRevision: number;
  onFileChange: (fileId: string, state: any) => any;
}

@withStyles(styles)
class Editor extends React.Component<EditorProps, any> {
  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.file.state}
        onChange={codeEditorState => this.props.onFileChange(this.props.file.id, codeEditorState)}
        sizeRevision={this.props.editorSizeRevision}
        readyToRender={true}
      />
    );
  }

  renderDesignEditor() {
    return (
      <VoxelEditor
        editorState={this.props.file.state}
        onChange={voxelEditorState => this.props.onFileChange(this.props.file.id, voxelEditorState)}
        sizeVersion={this.props.editorSizeRevision}
      />
    );
  }

  renderRobotEditor() {
    const state: RobotState = this.props.file.state;
    const codes = state.codes.map(id => this.props.files[id]);
    const design = this.props.files[state.design];

    const codeElement = codes.map(code => {
      return (
        <div key={code.id}>{code.name}</div>
      );
    })

    const designElement = (
      <div>{design.name}</div>
    );

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div>
          <h1>Robot editor</h1>

          <h2>Codes for this robot</h2>
          <div>Code list</div>
          {codeElement}
          <div>Add button (Open browser)</div>

          <h2>Design for this robot</h2>
          {designElement}
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
