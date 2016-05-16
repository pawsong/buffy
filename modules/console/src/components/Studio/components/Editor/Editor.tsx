import * as React from 'react';
const update = require('react-addons-update');

import DesignManager from '../../../../canvas/DesignManager';

import FileTabs from '../FileTabs';
import CodeEditor from '../../../../components/CodeEditor';
import ModelEditor from '../../../../components/ModelEditor';
import RecipeEditor from '../../../../components/RecipeEditor';

import { FileType } from '../../types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Editor.css');

import { FileDescriptor, SourceFile, RobotState } from '../../types';

interface EditorProps extends React.Props<Editor> {
  file: SourceFile;
  files: { [index: string]: SourceFile };
  focus: boolean;
  editorSizeRevision: number;
  onFileChange: (fileId: string, state: any) => any;
  designManager: DesignManager;
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
      <ModelEditor
        editorState={this.props.file.state}
        onChange={this.props.onFileChange}
        focus={this.props.focus}
        sizeVersion={this.props.editorSizeRevision}
      />
    );
  }

  renderRecipeEditor() {
    return (
      <RecipeEditor
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
        case FileType.MODEL: {
          editor = this.renderDesignEditor();
          break;
        }
        case FileType.ROBOT: {
          editor = this.renderRecipeEditor();
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
