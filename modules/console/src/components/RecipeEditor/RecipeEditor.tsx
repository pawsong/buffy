import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import SelectField from 'material-ui/lib/select-field';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RaisedButton from 'material-ui/lib/raised-button';
const objectAssign = require('object-assign');

import { SourceFile, FileType } from '../Studio/types';

const styles = {
  root: {
    margin: 20,
  },
}

export interface RecipeEditorState {
  codes?: string[];
  design?: string;
}

interface RobotEditorProps extends React.Props<RecipeEditor> {
  files: { [index: string]: SourceFile };
  editorState: RecipeEditorState;
  onChange: (editorState: RecipeEditorState) => any;
}

interface CreateStateOptions {
  codes: string[];
  design: string;
}

class RecipeEditor extends React.Component<RobotEditorProps, void> {
  static createState: (options: CreateStateOptions) => RecipeEditorState;

  handleStateChange(editorState: RecipeEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, editorState));
  }

  handleDesignChange(fileId: string) {
    this.handleStateChange({ design: fileId });
  }

  renderDesign() {
    const design = this.props.files[this.props.editorState.design];

    return (
      <div>
        <h2>Design</h2>
        <div>
          <img src={design.state.image.url} />
        </div>
        <div>
          <RaisedButton
            label="Change design"
          />
        </div>
      </div>
    );
  }

  renderCode() {
    const codes = this.props.editorState.codes.map(id => this.props.files[id]);
    const listItems = codes.map(file => (
      <ListItem
        key={file.id}
        primaryText={
          <span>{file.name || '(Untitled)'}</span>
        }
      />
    ));

    return (
      <div>
        <h2>Codes</h2>
        <List>{listItems}</List>
        <div>
          <RaisedButton
            label="Add code"
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div style={styles.root}>
        <div>
          <h1>Recipe editor</h1>
          <div className="row">
            <div className="col-md-6">
              {this.renderDesign()}
            </div>
            <div className="col-md-6">
              {this.renderCode()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

RecipeEditor.createState = (options: CreateStateOptions) => {
  return {
    codes: options.codes,
    design: options.design,
  };
};

export default RecipeEditor;