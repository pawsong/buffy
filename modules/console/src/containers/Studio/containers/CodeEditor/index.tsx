import * as React from 'react';
import { connect } from 'react-redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { EventSubscription } from 'fbemitter';
import { connect as connectStateLayer } from '../../../../containers/stateLayer';

import { State } from '../../../../reducers';
import {
  ToolState,
  BrushState,
  GameUsersState,
  ToolType,
  Color,
} from '../../../../reducers/game';
import {
  setWorkspace,
} from '../../../../actions/codeEditor';

if (__CLIENT__) {
  require('./blockly/blocks');
}

import { Blockly, Interpreter } from './blockly';

const toolbox = require('raw!./blockly/toolbox.xml');
const initBlock = require('raw!./blockly/initBlock.xml');

import * as StorageKeys from './constants/StorageKeys';

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

interface CodeEditorProps extends React.Props<CodeEditor> {
  sizeVersion: number;
  workspace?: any;
  setWorkspace?: (workspace: any) => any;
  active: boolean;
}

@connectStateLayer()
@connect((state: State) => ({
  workspace: state.codeEditor.workspace,
}), {
  setWorkspace,
})
class CodeEditor extends React.Component<CodeEditorProps, {}> {
  injected: boolean;
  workspace: any;

  constructor(props, context) {
    super(props, context);
    this.injected = false;
  }

  initWorkspace(workspace) {
    Blockly.JavaScript.init(workspace);
    const savedXml = localStorage.getItem(StorageKeys.BLOCKLY_WORKSPACE);
    const dom = Blockly.Xml.textToDom(savedXml || initBlock);
    Blockly.Xml.domToWorkspace(workspace, dom);
  }

  createHeadlessWorkspace() {
    const workspace = new Blockly.Workspace();
    this.initWorkspace(workspace);
    return workspace;
  }

  createInjectedWorkspace() {
    const workspace = Blockly.inject(this.refs['editor'], {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      trashcan: true,
    });

    this.initWorkspace(workspace);

    workspace.addChangeListener((e) => {
      const dom = Blockly.Xml.workspaceToDom(workspace);
      const xml = Blockly.Xml.domToText(dom);
      localStorage.setItem(StorageKeys.BLOCKLY_WORKSPACE, xml);
    });
    return workspace;
  }

  componentDidMount() {
    if (this.props.workspace !== null) {
      console.error('Another workspace is already in use');
      return;
    }

    // If Blockly workspace is installed when code editor tab is inactive,
    // the blocks are posed in weired positions.
    if (this.props.active) {
      this.workspace = this.createInjectedWorkspace();
      this.injected = true;
    } else {
      // Create temporary headless blockly
      this.workspace = this.createHeadlessWorkspace();
      this.injected = false;
    }
    this.props.setWorkspace(this.workspace);
  }

  componentWillReceiveProps(nextProps: CodeEditorProps) {
    if (this.props.sizeVersion !== nextProps.sizeVersion) {
      if (this.injected) Blockly.svgResize(this.workspace);
    }

    if (this.props.active === false && nextProps.active === true && !this.injected) {
      if (this.props.workspace !== this.workspace) {
        console.error('Another workspace is already in use');
        return;
      }

      const oldWorkspace = this.workspace;
      this.workspace = this.createInjectedWorkspace();
      this.props.setWorkspace(this.workspace);
      oldWorkspace.dispose();
      this.injected = true;
    }
  }

  componentWillUnmount() {
    if (this.props.workspace === this.workspace) {
      this.props.setWorkspace(null);
    } else {
      console.error('Another workspace is in use on workspace uninstall');
    }
    this.workspace.dispose();
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
