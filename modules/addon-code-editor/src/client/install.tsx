require('react-tap-event-plugin')();
import { InstallAddon } from '@pasta/addon/lib/Addon';
import StateLayer from '@pasta/addon/lib/StateLayer';
import UserProcess from './UserProcess';
import { EventEmitter } from 'fbemitter';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as axios from 'axios';
import {
  Avatar,
  Toolbar,
  ToolbarGroup,
  ToolbarTitle,
  RaisedButton,
  Tabs,
  Tab,
  IconButton,
} from 'material-ui';

const navbarHeight = 48;

const styles = {
  toolbar: {
    height: navbarHeight,
  },
  editor: {
    position: 'absolute',
    top: navbarHeight,
    bottom: 0,
    left: 0,
    right: 0,
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

interface ContainerProps extends React.Props<Container> {
  stateLayer: StateLayer;
}

class Container extends React.Component<ContainerProps, {}> {
  editor: AceAjax.Editor;
  proc: UserProcess;

  componentDidMount() {
    // Code editor
    const editor = this.editor = ace.edit(this.refs['editor'] as HTMLElement);
    editor.setTheme('ace/theme/twilight');
    editor.session.setMode('ace/mode/javascript');
    editor.setValue(snippet);
    editor.clearSelection();
  }

  handleRun() {
    if (this.proc) {
      this.proc.terminate();
      this.proc = null;
    }
    const source = this.editor.getValue();
    this.proc = new UserProcess(source, this.props.stateLayer);
  }

  render() {
    return <div>
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup key={0} float="left">
          <RaisedButton label="Run" style={{ marginTop: 6 }}
          primary={true} onClick={this.handleRun.bind(this)}/>
        </ToolbarGroup>
      </Toolbar>
      <div ref="editor" style={styles.editor}></div>
    </div>
  }
}

const install: InstallAddon = (container, stateLayer) => {
  ReactDOM.render(
    <Container stateLayer={stateLayer}/>,
    container
  );
  return () => ReactDOM.unmountComponentAtNode(container);
};

export default install;
