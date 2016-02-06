import * as React from 'react';

import Toolbar = require('material-ui/lib/toolbar/toolbar');
import ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group');
import RaisedButton = require('material-ui/lib/raised-button');

import * as jQuery from 'jquery';
window['jQuery'] = jQuery;
import 'script!jquery.terminal/js/jquery.terminal-0.9.3';
import 'jquery.terminal/css/jquery.terminal-0.9.3.css';

import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import { Layout, LayoutContainer } from './Layout';
import UserProcess from '../UserProcess';

const TOOLBAR_HEIGHT = 48;
const TERMINAL_HEIGHT = 150;

const styles = {
  toolbar: {
    height: TOOLBAR_HEIGHT,
  },
  paneContainer: {
    position: 'absolute',
    top: TOOLBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
  editor: {
    position: 'absolute',
    margin: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  terminal: {
    position: 'absolute',
    padding: 0,
    margin: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflowY: 'scroll',
  },
};

const snippet =
`import { player, util } from '@pasta/core';

util.loop(async () => {
  await player.move(1, 1);
  await util.sleep(1000);
  await player.move(2, 3);
  await util.sleep(1000);
  await player.boom();
  await util.sleep(2000);
});`;

interface AppProps extends React.Props<App> {
  stateLayer?: StateLayer;
}

@connectStateLayer()
class App extends React.Component<AppProps, {}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'App';

  editor: AceAjax.Editor;
  terminal: any;
  terminalContainer: JQuery;
  proc: UserProcess;

  componentDidMount() {
    // Code editor
    const editor = this.editor = ace.edit(this.refs['editor'] as HTMLElement);
    editor.setTheme('ace/theme/twilight');
    editor.session.setMode('ace/mode/javascript');
    editor.setValue(snippet);
    editor.clearSelection();

    // Terminal
    const terminalElem = jQuery('#terminal');
    this.terminalContainer = terminalElem.parent();
    this.terminal = terminalElem['terminal'](() => {}, {
      greetings: 'Logs',
      name: 'js_demo',
      height: 200,
      prompt: '> ',
    });
  }

  componentWillUnmount() {
    this.destroyProcess();
  }

  destroyProcess() {
    if (this.proc) {
      this.proc.terminate();
      this.proc = null;
    }
  }

  handleRun() {
    this.destroyProcess();

    const source = this.editor.getValue();

    this.terminal.echo('Compiling...');
    this.proc = new UserProcess(source, this.props.stateLayer);

    this.proc.addListener('log', log => {
        this.terminal.echo(log.message);
    });
  }

  onEditorResize = () => this.editor.resize()

  onTerminalResize = () => {
    this.terminal.resize(this.terminalContainer.width(), this.terminalContainer.height());
  }

  render() {
    return <div>
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup key={0} float="left">
          <RaisedButton label="Run" style={{ marginTop: 6 }}
          primary={true} onClick={this.handleRun.bind(this)}/>
        </ToolbarGroup>
      </Toolbar>
      <Layout flow="column" style={styles.paneContainer}>
        <LayoutContainer remaining={true} onResize={this.onEditorResize}>
          <pre ref="editor" style={styles.editor}></pre>
        </LayoutContainer>
        <LayoutContainer size={200} onResize={this.onTerminalResize}>
          <pre ref="terminal" id="terminal" style={styles.terminal}></pre>
        </LayoutContainer>
      </Layout>
    </div>;
  };
}

export default App;
