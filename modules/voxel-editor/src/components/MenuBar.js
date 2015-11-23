import React from 'react';
import IconMenuContainer from './IconMenuContainer';

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

  render() {
    const styles = {
      menu: {
        padding: '3px 5px',
        margin: '5px 2px',
        cursor: 'pointer',
      },
    };

    return <div>
      <Dialog
        title="Message"
        actions={[{ text: 'Cancel' }]}
        open={this.state.showDialog}
        onRequestClose={this._hideDialog}>
        {this.state.dialogMessage}
      </Dialog>
      <MenuBarContent style={{ marginLeft: 5 }}>
        <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>
        <IconMenu iconButtonElement={ <div style={styles.menu}>File</div> }>
          <MenuItem primaryText="Refresh" onTouchTap={this._showDialog} />
          <MenuItem primaryText="Load Sprites" onTouchTap={this._showDialog} />
          <IconMenu style={{ display: 'block' }} menuStyle={{
            top: 0, left: '100%',
          }} iconButtonElement={
            <MenuItem primaryText="Sign out" rightIcon={<ArrowDropRight />} />
          }>
            <MenuItem primaryText="Refresh" />
            <MenuItem primaryText="Send feedback" />
            <MenuItem primaryText="Settings" />
            <MenuItem primaryText="Help" />
            <MenuItem primaryText="Sign out" />
          </IconMenu>
          <IconMenu style={{ display: 'block' }} menuStyle={{
            top: 0, left: '100%',
          }} iconButtonElement={
            <MenuItem primaryText="Sign out" rightIcon={<ArrowDropRight />} />
            }>
            <MenuItem primaryText="Refresh" />
            <MenuItem primaryText="Send feedback" />
            <MenuItem primaryText="Settings" />
            <MenuItem primaryText="Help" />
            <MenuItem primaryText="Sign out" />
          </IconMenu>
        </IconMenu>
        <IconMenu iconButtonElement={ <div style={styles.menu}>Edit</div> }>
          <MenuItem primaryText="Refresh" />
          <MenuItem primaryText="Send feedback" />
          <MenuItem primaryText="Settings" />
          <MenuItem primaryText="Help" />
          <IconMenu style={{ display: 'block' }} menuStyle={{
            top: 0, left: '100%',
          }} iconButtonElement={
            <MenuItem desktop={true} primaryText="Sign out" rightIcon={<ArrowDropRight />} />
            }>
            <MenuItem primaryText="Refresh" />
            <MenuItem primaryText="Send feedback" />
            <MenuItem primaryText="Settings" />
            <MenuItem primaryText="Help" />
            <MenuItem primaryText="Sign out" />
          </IconMenu>
          <IconMenu style={{ display: 'block' }} menuStyle={{
            top: 0, left: '100%',
          }} iconButtonElement={
            <MenuItem desktop={true} primaryText="Sign out" rightIcon={<ArrowDropRight />} />
            }>
            <MenuItem primaryText="Refresh" />
            <MenuItem primaryText="Send feedback" />
            <MenuItem primaryText="Settings" />
            <MenuItem primaryText="Help" />
            <MenuItem primaryText="Sign out" />
          </IconMenu>
        </IconMenu>
        <IconMenu iconButtonElement={ <div style={styles.menu}>Window</div> }>
          <MenuItem primaryText="Toggle Fullscreen" onTouchTap={this._toggleFullscreen}/>
        </IconMenu>
      </MenuBarContent>
    </div>;
  },
});

export default MenuBar;
