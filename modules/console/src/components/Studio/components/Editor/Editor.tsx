import * as React from 'react';
const update = require('react-addons-update');

import FileTabs from '../FileTabs';
import CodeEditor, { CodeEditorState } from '../../../CodeEditor';
import ModelEditor, { ModelEditorState, ModelCommonState } from '../../../ModelEditor';
import RecipeEditor, { RecipeEditorState } from '../../../RecipeEditor';

import { FileType } from '../../types';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Editor.css');

import { FileDescriptor, SourceFile, RobotState } from '../../types';

import ModelManager from '../../../../canvas/ModelManager';

interface EditorProps extends React.Props<Editor> {
  file: SourceFile;
  files: { [index: string]: SourceFile };
  modelManager: ModelManager;
  editorSizeRevision: number;
  onFileChange: (fileId: string, state: any, modified: boolean) => any;
  onModelApply: (file: SourceFile) => any;
}

interface EditorState {
  modelCommonState?: ModelCommonState;
}

@withStyles(styles)
class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props) {
    super(props);
    this.state = {
      modelCommonState: ModelEditor.createCommonState(),
    };
  }

  handleFileStateChange = (nextState: any, modified: boolean) => {
    this.props.onFileChange(this.props.file.id, nextState, modified);
  }

  handleModelFileApply = () => {
    this.props.onModelApply(this.props.file);
  }

  handleCodeStateChange = (state: CodeEditorState) => {
    this.props.onFileChange(this.props.file.id, state, true);
  }

  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.file.state}
        onChange={this.handleCodeStateChange}
        sizeRevision={this.props.editorSizeRevision}
        readyToRender={true}
      />
    );
  }

  handleModelCommonStateChange = (commonState: ModelCommonState) => {
    this.setState({ modelCommonState: commonState });
  }

  handleModelFileStateChange = (state: ModelEditorState) => {
    this.props.onFileChange(this.props.file.id, state, ModelEditor.isModified(this.props.file.savedState, state));
  }

  renderDesignEditor() {
    return (
      <ModelEditor
        commonState={this.state.modelCommonState}
        onCommonStateChange={this.handleModelCommonStateChange}
        fileState={this.props.file.state}
        onFileStateChange={this.handleModelFileStateChange}
        onApply={this.handleModelFileApply}
        sizeVersion={this.props.editorSizeRevision}
        extraData={this.props.file.extraData}
      />
    );
  }

  handleRecipeStateChange = (state: RecipeEditorState) => {
    this.props.onFileChange(this.props.file.id, state, true);
  }

  renderRecipeEditor() {
    return (
      <RecipeEditor
        modelManager={this.props.modelManager}
        editorState={this.props.file.state}
        onChange={this.handleRecipeStateChange}
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
