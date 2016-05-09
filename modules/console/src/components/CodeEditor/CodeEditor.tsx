import * as React from 'react';
import * as invariant from 'invariant';
const objectAssign = require('object-assign');
const pure = require('recompose/pure').default;

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
  fileId?: string;
  blocklyXml?: string;
}

interface CodeEditorProps extends React.Props<CodeEditor> {
  editorState: CodeEditorState;
  onChange: (fileId: string, state: CodeEditorState) => any;
  sizeRevision: number;
  readyToRender: boolean;
}

export interface CreateStateOptions extends CodeEditorState {
  blocklyXml?: string;
}

@pure
class CodeEditor extends React.Component<CodeEditorProps, void> {
  static creatState: (fileId: string, options?: CreateStateOptions) => CodeEditorState;

  workspace: any;

  constructor(props, context) {
    super(props, context);
    this.workspace = null;
  }

  setEditorState(nextState: CodeEditorState) {
    this.props.onChange(this.props.editorState.fileId, nextState);
  }

  injectWorkspace() {
    invariant(!this.workspace, 'Cannot inject multiple workspace instances');

    this.workspace = Blockly.inject(this.refs['editor'], {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
      },
      trashcan: true,
    });

    Blockly.JavaScript.init(this.workspace);
    const savedXml = this.props.editorState.blocklyXml;
    const dom = Blockly.Xml.textToDom(savedXml || initBlock);
    Blockly.Xml.domToWorkspace(dom, this.workspace);

    // Blockly emits events for installation in the next frame.
    setTimeout(() => {
      this.workspace.addChangeListener((e) => {
        if (e.type === 'ui') return;

        const dom = Blockly.Xml.workspaceToDom(this.workspace);
        const xml = Blockly.Xml.domToText(dom);
        this.setEditorState({ blocklyXml: xml });
      });
    }, 0);
  }

  componentDidMount() {
    if(this.props.readyToRender) {
      this.injectWorkspace();
    }
  }

  componentWillReceiveProps(nextProps: CodeEditorProps) {
    if (this.workspace) {
      if (this.props.sizeRevision !== nextProps.sizeRevision) {
        Blockly.svgResize(this.workspace);
      }

      if (this.props.editorState.fileId !== nextProps.editorState.fileId) {
        const dom = Blockly.Xml.textToDom(nextProps.editorState.blocklyXml);
        this.workspace.clear();
        Blockly.Xml.domToWorkspace(dom, this.workspace);
      }
      return;
    }

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

CodeEditor.creatState = (fileId: string, options: CreateStateOptions = {}): CodeEditorState => {
  return {
    fileId,
    blocklyXml: options.blocklyXml || initBlock,
  };
}

export default CodeEditor;
