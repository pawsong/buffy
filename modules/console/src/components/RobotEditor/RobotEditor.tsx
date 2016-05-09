import * as React from 'react';
import SelectField from 'material-ui/lib/select-field';
import MenuItem from 'material-ui/lib/menus/menu-item';
const objectAssign = require('object-assign');

import { SourceFile, FileType } from '../Studio/types';

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
}

export interface RobotEditorState {
  codes?: string[];
  design?: string;
}

interface RobotEditorProps extends React.Props<RobotEditor> {
  files: { [index: string]: SourceFile };
  editorState: RobotEditorState;
  onChange: (editorState: RobotEditorState) => any;
}

interface CreateStateOptions {
  codes: string[];
  design: string;
}

class RobotEditor extends React.Component<RobotEditorProps, void> {
  static createState: (options: CreateStateOptions) => RobotEditorState;

  handleStateChange(editorState: RobotEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, editorState));
  }

  handleDesignChange(fileId: string) {
    this.handleStateChange({ design: fileId });
  }

  render() {
    const codes = this.props.editorState.codes.map(id => this.props.files[id]);
    const design = this.props.files[this.props.editorState.design];

    const codeElement = codes.map(code => {
      return (
        <div key={code.id}>{code.name}</div>
      );
    })

    const designMenuItems = Object.keys(this.props.files)
      .map(key => this.props.files[key])
      .filter(file => file.type === FileType.DESIGN)
      .map(file => {
        return (
          <MenuItem
            key={file.id}
            value={file.id}
            primaryText={file.name || '(Untitled)'}
          />
        );
      });

    return (
      <div style={styles.root}>
        <div>
          <h1>Robot editor</h1>

          <h2>Codes for this robot</h2>
          <div>Code list</div>
          {codeElement}
          <div>Add button (Open browser)</div>

          <h2>Design for this robot</h2>

          <SelectField value={design.id} onChange={(e, index, value) => this.handleDesignChange(value)}>
            {designMenuItems}
          </SelectField>

          <div>Preview</div>
          <div>Select button (Open browser)</div>
        </div>
      </div>
    );
  }
}

RobotEditor.createState = (options: CreateStateOptions) => {
  return {
    codes: options.codes,
    design: options.design,
  };
};

export default RobotEditor;
