import * as React from 'react';
import { findDOMNode } from 'react-dom';
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

import {
  CodeEditorState,
  ExtraData,
  SerializedData,
} from './types';

interface CodeEditorProps extends React.Props<CodeEditor> {
  editorState: CodeEditorState;
  extraData: ExtraData;
  onChange: (state: CodeEditorState) => any;
  sizeRevision: number;
  readyToRender: boolean;
}

export interface CreateStateOptions {
  blocklyXml?: string;
}

@pure
class CodeEditor extends React.Component<CodeEditorProps, void> {
  static createState: () => CodeEditorState;
  static createExtraData: (xml?: string) => ExtraData;
  static serialize: (data: ExtraData) => SerializedData;
  static deserialize: (data: SerializedData) => ExtraData;

  private rootElement: HTMLElement;

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
    this.rootElement.appendChild(this.props.extraData.container);
    Blockly.svgResize(this.props.extraData.workspace);
  }

  componentWillReceiveProps(nextProps: CodeEditorProps) {
    if (this.props.extraData.container !== nextProps.extraData.container) {
      this.rootElement.removeChild(this.props.extraData.container);
      this.rootElement.appendChild(nextProps.extraData.container);
      Blockly.svgResize(nextProps.extraData.workspace);
      nextProps.extraData.workspace.markFocused();
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

CodeEditor.createState = (): CodeEditorState => {
  return {
    revision: 0,
  };
}

CodeEditor.createExtraData = (xml?: string) => {
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

  const dom = Blockly.Xml.textToDom(xml || initBlock);
  Blockly.Xml.domToWorkspace(dom, workspace);

  document.body.removeChild(container);

  return {
    container,
    workspace,
  };
};

CodeEditor.serialize = data => {
  const dom = Blockly.Xml.workspaceToDom(data.workspace);
  const xml = Blockly.Xml.domToText(dom);

  return { blocklyXml: xml };
};

CodeEditor.deserialize = data => {
  return CodeEditor.createExtraData(data.blocklyXml);
};

export default CodeEditor;
