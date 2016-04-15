import * as React from 'react';
import * as invariant from 'invariant';
const objectAssign = require('object-assign');

import Blockly from '../../blockly';

if (__CLIENT__) require('../../blockly/blocks');

const toolbox = require('raw!../../blockly/toolbox.xml');
const initBlock: string = require('raw!../../blockly/initBlock.xml');

const styles = {
  editor: {
    position: 'absolute',
    margin: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
};

export interface CodeEditorState {
  blocklyXml?: string;
}

const defaultEditorState: CodeEditorState = {
  blocklyXml: initBlock,
};

interface CodeEditorProps extends React.Props<CodeEditor> {
  editorState: CodeEditorState;
  onChange: (state: CodeEditorState) => any;
  sizeRevision: number;
  readyToRender: boolean;
}

class CodeEditor extends React.Component<CodeEditorProps, void> {
  workspace: any;

  static creatState(initialState?: CodeEditorState): CodeEditorState {
    return objectAssign({}, defaultEditorState, initialState);
  }

  constructor(props, context) {
    super(props, context);
    this.workspace = null;
  }

  setEditorState(nextState: CodeEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, nextState));
  }

  injectWorkspace() {
    invariant(!this.workspace, 'Cannot inject multiple workspace instances');

    this.workspace = Blockly.inject(this.refs['editor'], {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      trashcan: true,
    });

    Blockly.JavaScript.init(this.workspace);
    const savedXml = this.props.editorState.blocklyXml;
    const dom = Blockly.Xml.textToDom(savedXml || initBlock);
    Blockly.Xml.domToWorkspace(dom, this.workspace);

    this.workspace.addChangeListener((e) => {
      const dom = Blockly.Xml.workspaceToDom(this.workspace);
      const xml = Blockly.Xml.domToText(dom);
      this.setEditorState({ blocklyXml: xml });
    });
  }

  componentDidMount() {
    if(this.props.readyToRender) {
      this.injectWorkspace();
    }
  }

  componentWillReceiveProps(nextProps: CodeEditorProps) {
    if (this.workspace) return;

    if (nextProps.readyToRender) this.injectWorkspace();
  }

  componentWillUnmount() {
    if (this.workspace) {
      this.workspace.dispose();
      this.workspace = null;
    }
  }

  render() {
    return (
      <div>
        <div ref="editor" style={styles.editor}></div>
      </div>
    );
  }
}

export default CodeEditor;
