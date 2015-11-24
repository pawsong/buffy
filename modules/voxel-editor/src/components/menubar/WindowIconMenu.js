import React from 'react';
import IconMenu from './icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';

const WindowIconMenu = React.createClass({
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

  render() {
    return <div style={{ display: 'inline-block' }}>
      <IconMenu {...this.props} iconButtonElement={ <RootIcon>Window</RootIcon> }>
        <MenuItem primaryText="Toggle fullscreen" onTouchTap={this._toggleFullscreen}/>
      </IconMenu>
    </div>
  },
});

export default WindowIconMenu;
