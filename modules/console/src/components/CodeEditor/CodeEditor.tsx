import * as React from 'react';
import { findDOMNode } from 'react-dom';
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

import { CodeEditorState } from './types';

interface CodeEditorProps extends React.Props<CodeEditor> {
  editorState: CodeEditorState;
  onChange: (state: CodeEditorState) => any;
  sizeRevision: number;
  readyToRender: boolean;
}

export interface CreateStateOptions {
  blocklyXml?: string;
}

@pure
class CodeEditor extends React.Component<CodeEditorProps, void> {
  static creatState: (fileId: string, options?: CreateStateOptions) => CodeEditorState;
  rootElement: HTMLElement;

  constructor(props) {
    super(props);
  }

  incrementRevision() {
    this.props.onChange(Object.assign({}, this.props.editorState, {
      revision: this.props.editorState.revision + 1,
    }));
  }

  componentDidMount() {
    this.rootElement = findDOMNode<HTMLElement>(this.refs['editor']);
    this.rootElement.appendChild(this.props.editorState.container);
    Blockly.svgResize(this.props.editorState.workspace);
  }

  componentWillReceiveProps(nextProps: CodeEditorProps) {
    if (this.props.editorState.container !== nextProps.editorState.container) {
      this.rootElement.removeChild(this.props.editorState.container);
      this.rootElement.appendChild(nextProps.editorState.container);
      Blockly.svgResize(nextProps.editorState.workspace);
      nextProps.editorState.workspace.markFocused();
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
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.height = '100%';
  container.style.width = '100%';

  document.body.appendChild(container);

  const workspace = Blockly.inject(container, {
    toolbox,
    grid: {
      spacing: 20,
      length: 3,
      colour: '#ccc',
    },
    trashcan: true,
  });

  document.body.removeChild(container);

  return {
    container,
    workspace,
    revision: 0,
  };
}

export default CodeEditor;
