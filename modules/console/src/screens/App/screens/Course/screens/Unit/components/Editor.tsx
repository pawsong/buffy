import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';

import Toolbar = require('material-ui/lib/toolbar/toolbar');
import ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group');
import RaisedButton = require('material-ui/lib/raised-button');

import Tabs = require('material-ui/lib/tabs/tabs');
import Tab = require('material-ui/lib/tabs/tab');

import * as StorageKeys from '../../../../../../../constants/StorageKeys';

import {
  Layout,
  LayoutContainer,
} from '../../../../../../../components/Layout';

interface EditorProps extends React.Props<{}> {
  stateLayer: StateLayer;
}

interface EditorState {
  mounted?: boolean;
}

class Editor extends React.Component<EditorProps, EditorState> {
  initialTabIndex: number;
  initialVerticalPaneSize: number;
  initialLeftHorizontalPaneSize: number;
  activeTabName: string;
  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;

  constructor(props, context) {
    super(props, context);
    this.state = {
      mounted: false,
    };
  }

  componentDidMount() {
    this.activeTabName = localStorage.getItem(StorageKeys.MASTER_INITIAL_TAB) || 'addon-voxel-editor';
    // this.initialTabIndex = Math.max(
    //   MasterTabNames.indexOf(this.activeTabName), 0
    // );
    this.initialVerticalPaneSize = parseInt(localStorage.getItem(StorageKeys.MASTER_PANE_V_SIZE) || '600', 10);
    this.initialLeftHorizontalPaneSize = parseInt(localStorage.getItem(StorageKeys.MASTER_PANE_LEFT_H_SIZE) || '480', 10);
    this.setState({ mounted: true });
  }

  onResize() {

  }

  onResizeAddon(name) {

  }

  onTabChange() {

  }

  onResizeVertical(size) {

  }

  onResizeLeftHorizontal(size) {

  }

  handleRun() {

  }

  render() {
    if (!this.state.mounted) {
      return <div>Loading...</div>;
    }

    const tabs = null;
    return (
      <div>
        <Layout flow="row" style={styles.content}>
          <LayoutContainer size={this.initialVerticalPaneSize} onResize={size => this.onResizeVertical(size)}>
            <Layout flow="column" style={styles.fillParent}>
              <LayoutContainer size={this.initialLeftHorizontalPaneSize} onResize={size => this.onResizeLeftHorizontal(size)}>
                <div ref="addon-game" style={styles.game}></div>
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <Toolbar>
                  <ToolbarGroup key={0} float="right">
                    <RaisedButton label="Run"
                    primary={true} onClick={this.handleRun.bind(this)}/>
                  </ToolbarGroup>
                </Toolbar>
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true} onResize={() => this.onResizeAddon(this.activeTabName)}>
            <Tabs contentContainerStyle={styles.addon}
              tabTemplate={TabTemplate}
              initialSelectedIndex={this.initialTabIndex} onChange={this.onTabChange.bind(this)}>
              {tabs}
            </Tabs>
          </LayoutContainer>
        </Layout>
      </div>
    );

    // return (
    //   <div>
    //     <Layout flow="row" style={styles.content}>
    //       <LayoutContainer size={this.initialVerticalPaneSize} onResize={size => this.onResizeVertical(size)}>
    //         <Layout flow="column" style={styles.fillParent}>
    //           <LayoutContainer size={this.initialLeftHorizontalPaneSize} onResize={size => this.onResizeLeftHorizontal(size)}>
    //             <div ref="addon-game" style={styles.game}></div>
    //             {addonOverlays['addon-game']}
    //           </LayoutContainer>
    //           <LayoutContainer remaining={true}>
    //             <Toolbar>
    //               <ToolbarGroup key={0} float="right">
    //                 <RaisedButton label="Run"
    //                 primary={true} onClick={this.handleRun.bind(this)}/>
    //               </ToolbarGroup>
    //             </Toolbar>
    //           </LayoutContainer>
    //         </Layout>
    //       </LayoutContainer>

    //       <LayoutContainer remaining={true} onResize={() => this.onResizeAddon(this.activeTabName)}>
    //         <Tabs contentContainerStyle={styles.addon}
    //           tabTemplate={TabTemplate}
    //           initialSelectedIndex={this.initialTabIndex} onChange={this.onTabChange.bind(this)}>
    //           {tabs}
    //         </Tabs>
    //       </LayoutContainer>
    //     </Layout>

    //   </div>
    // );
  }
}

export default Editor;

interface TabTemplateProps extends React.Props<TabTemplate> {
  selected: boolean;
}

class TabTemplate extends React.Component<TabTemplateProps, {}> {
  render() {
    let styles: {
      width: string;
      height: string;
      display?: string;
    } = {
      'width': '100%',
      'height': '100%',
    };

    if (!this.props.selected) {
      styles.display = 'none';
    }

    return (
      <div style={styles}>
        {this.props.children}
      </div>
    );
  }
};

const styles = {
  profile: {
    position: 'absolute',
    top: -4,
    right: 50,
    zIndex: 1500,
  },
  content: {
    position: 'absolute',
    // top: NAVBAR_HEIGHT,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  addon: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fillParent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  game: {
    margin: 'auto',
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
  overlayInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
};
