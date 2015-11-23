import React from 'react';
import IconMenuContainer from './IconMenuContainer';

import RootIcon from './RootIcon';

const Dialog = require('material-ui/lib/dialog');

const IconMenu = require('./icon-menu');
const MenuItem = require('material-ui/lib/menus/menu-item');

const ArrowDropRight = require('material-ui/lib/svg-icons/navigation-arrow-drop-right');

const MenuBarContent = React.createClass({
  mixins: [IconMenuContainer],
  render() {
    const children = this.bindChildren();
    return <div style={this.props.style}>{children}</div>;
  },
});

const MenuBar = React.createClass({
  getInitialState() {
    return { showDialog: false };
  },

  _showDialog() {
    this.setState({
      showDialog: true,
      dialogMessage: 'Not yet implemented',
    });
  },

  _hideDialog() {
    this.setState({ showDialog: false });
  },

  componentWillMount() {
    const { rootElement } = this.props;

    let fullscreen = false;
    const fullscreenStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      zIndex: 1,
    };
    const oldStyle = {};
    Object.keys(fullscreenStyle).forEach(prop => oldStyle[prop] = rootElement.style[prop]);

    const turnOnFullscreen = () => {
      setTimeout(() => {
        fullscreen = true;
        Object.keys(fullscreenStyle).forEach(
          prop => rootElement.style[prop] = fullscreenStyle[prop]
        );
        window.dispatchEvent(new Event('resize'));
      }, 0);
    };

    const turnOffFullscreen = () => {
      setTimeout(() => {
        fullscreen = false;
        Object.keys(fullscreenStyle).forEach(
          prop => rootElement.style[prop] = oldStyle[prop]
        );
        window.dispatchEvent(new Event('resize'));
      }, 0);
    };

    this._toggleFullscreen = () => !fullscreen ? turnOnFullscreen() : turnOffFullscreen();
  },

  _setFullscreen() {
    const { rootElement } = this.props;

    rootElement.style.position = 'fixed';
    rootElement.style.top = 0;
    rootElement.style.left = 0;
    rootElement.style.bottom = 0;
    rootElement.style.right = 0;
    rootElement.style.zIndex = 1;
    window.dispatchEvent(new Event('resize'));
  },

  _handleNewObject() {
    setTimeout(() => {
      this._showDialog();
    }, 0);
  },

  _handleSave() {
    console.log('save');
  },

  render() {
    return <div>
      <Dialog
        title="Message"
        actions={[{ text: 'Cancel' }]}
        open={this.state.showDialog}
        onRequestClose={this._hideDialog}>
        {this.state.dialogMessage}
      </Dialog>

      <MenuBarContent iconMenuStyle={{ display: 'inline-block' }} iconMenuMenuStyle={{
        top: null, left: 0,
      }} style={{ paddingLeft: 5, backgroundColor: '#FFFFFF' }}>
        <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>

        {/* File Menu */}
        <IconMenu width={192} iconButtonElement={ <RootIcon>File</RootIcon> }>
          <IconMenu iconButtonElement={
            <MenuItem primaryText="New" rightIcon={<ArrowDropRight />} />
            }>
            <MenuItem primaryText="Object" onTouchTap={this._handleNewObject}/>
          </IconMenu>
          <MenuItem primaryText="Save" secondaryText="⌘O" onTouchTap={this._handleSave}/>
        </IconMenu>

        {/* Window Menu */}
        <IconMenu iconButtonElement={ <RootIcon>Window</RootIcon> }>
          <MenuItem primaryText="Toggle Fullscreen" onTouchTap={this._toggleFullscreen}/>
        </IconMenu>

      </MenuBarContent>
    </div>;
  },
});

export default MenuBar;
