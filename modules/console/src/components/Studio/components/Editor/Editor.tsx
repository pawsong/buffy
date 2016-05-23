import * as React from 'react';
const update = require('react-addons-update');

import FileTabs from '../FileTabs';
import CodeEditor from '../../../CodeEditor';
import ModelEditor from '../../../ModelEditor';
import RecipeEditor from '../../../RecipeEditor';

import { FileType } from '../../types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Editor.css');

import { FileDescriptor, SourceFile, RobotState } from '../../types';

import ModelManager from '../../../../canvas/ModelManager';

interface EditorProps extends React.Props<Editor> {
  file: SourceFile;
  files: { [index: string]: SourceFile };
  modelManager: ModelManager;
  focus: boolean;
  editorSizeRevision: number;
  onFileChange: (fileId: string, state: any) => any;
}

@withStyles(styles)
class Editor extends React.Component<EditorProps, any> {
  handleFileStateChange = (nextState: any) => {
    this.props.onFileChange(this.props.file.id, nextState);
  }

  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.file.state}
        onChange={editorState => this.props.onFileChange(this.props.file.id, editorState)}
        sizeRevision={this.props.editorSizeRevision}
        readyToRender={true}
      />
    );
  }

  renderDesignEditor() {
    return (
      <ModelEditor
        editorState={this.props.file.state}
        onChange={this.handleFileStateChange}
        focus={this.props.focus}
        sizeVersion={this.props.editorSizeRevision}
      />
    );
  }

  renderRecipeEditor() {
    return (
      <RecipeEditor
        modelManager={this.props.modelManager}
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
