import IconMenuContainer from './IconMenuContainer';

const React = require('react');
const ReactDOM = require('react-dom');
const ClickAwayable = require('material-ui/lib/mixins/click-awayable');
const StylePropable = require('material-ui/lib/mixins/style-propable');
const Events = require('material-ui/lib/utils/events');
const PropTypes = require('material-ui/lib/utils/prop-types');
const Menu = require('material-ui/lib/menus/menu');
const DefaultRawTheme = require('material-ui/lib/styles/raw-themes/light-raw-theme');
const ThemeManager = require('material-ui/lib/styles/theme-manager');
const ColorManipulator = require('material-ui/lib/utils/color-manipulator');

const IconMenu = React.createClass({

  displayName: 'IconMenu',

  mixins: [StylePropable, ClickAwayable, IconMenuContainer],

  contextTypes: {
    muiTheme: React.PropTypes.object,
  },

  propTypes: {
    closeOnItemTouchTap: React.PropTypes.bool,
    iconButtonElement: React.PropTypes.element.isRequired,
    iconStyle: React.PropTypes.object,
    openDirection: PropTypes.corners,
    onItemTouchTap: React.PropTypes.func,
    onKeyboardFocus: React.PropTypes.func,
    onMouseDown: React.PropTypes.func,
    onMouseLeave: React.PropTypes.func,
    onMouseEnter: React.PropTypes.func,
    onMouseUp: React.PropTypes.func,
    onTouchTap: React.PropTypes.func,
    menuStyle: React.PropTypes.object,
    style: React.PropTypes.object,
    touchTapCloseDelay: React.PropTypes.number,

    // Added
    open: React.PropTypes.func,
    close: React.PropTypes.func,
    closeContainer: React.PropTypes.func,
    isOpen: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      closeOnItemTouchTap: true,
      openDirection: 'bottom-right',
      onItemTouchTap: () => {},
      onKeyboardFocus: () => {},
      onMouseDown: () => {},
      onMouseLeave: () => {},
      onMouseEnter: () => {},
      onMouseUp: () => {},
      onTouchTap: () => {},
      touchTapCloseDelay: 0,

      // Added
      open: () => {},
      close: () => {},
      closeContainer: () => {},
      isOpen: false,
    };
  },

  //for passing default theme context to children
  childContextTypes: {
    muiTheme: React.PropTypes.object,
  },

  getChildContext () {
    return {
      muiTheme: this.state.muiTheme,
    };
  },

  getInitialState () {
    return {
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme),
      iconButtonRef: this.props.iconButtonElement.props.ref || 'iconButton',
      menuInitiallyKeyboardFocused: false,
      open: false,
    };
  },

  //to update theme inside state whenever a new theme is passed down
  //from the parent / owner using context
  componentWillReceiveProps (nextProps, nextContext) {
    let newMuiTheme = nextContext.muiTheme ? nextContext.muiTheme : this.state.muiTheme;
    this.setState({muiTheme: newMuiTheme});
  },

  componentWillUnmount() {
    if (this._timeout) clearTimeout(this._timeout);
  },

  componentClickAway() {
    this.close();
  },

  render() {
    let {
      className,
      closeOnItemTouchTap,
      iconButtonElement,
      iconStyle,
      openDirection,
      onItemTouchTap,
      onKeyboardFocus,
      onMouseDown,
      onMouseLeave,
      onMouseEnter,
      onMouseUp,
      onTouchTap,
      menuStyle,
      style,
      focusState,
      ...other,
    } = this.props;

    let open = this.props.isOpen;
    let openDown = openDirection.split('-')[0] === 'bottom';
    let openLeft = openDirection.split('-')[1] === 'left';

    let styles = {
      root: {
        display: 'inline-block',
        position: 'relative',
      },

      menu: {
        top: null,
        bottom: !openDown ? 12 : null,
        left: !openLeft ? 0 : null,
        right: openLeft ? 12 : null,
      },
    };

    let mergedRootStyles = this.prepareStyles(styles.root, style);
    let mergedMenuStyles = this.mergeStyles(styles.menu, menuStyle);

    const textColor = this.state.muiTheme.rawTheme.palette.textColor;
    const hoverColor = ColorManipulator.fade(textColor, 0.1);

    let iconButton = React.cloneElement(iconButtonElement, {
      focusState,
      desktop: true,
      onKeyboardFocus: this.props.onKeyboardFocus,
      iconStyle: this.mergeStyles(iconStyle, iconButtonElement.props.iconStyle),
      style: this.mergeStyles({
        backgroundColor: open || focusState === 'keyboard-focused' ? hoverColor : null,
      }, iconButtonElement.props.style),
      onTouchTap: (e) => {
        this.open(Events.isKeyboard(e));
        if (iconButtonElement.props.onTouchTap) iconButtonElement.props.onTouchTap(e);
      },
      onMouseEnter: (e) => {
        this.open(Events.isKeyboard(e));
      },
      ref: this.state.iconButtonRef,
    });

    const children = this.bindChildren();

    let menu = open ? (
      <Menu
        {...other}
        listStyle={{ display: 'block' }}
        desktop={true}
        animated={false}
        initiallyKeyboardFocused={this.state.menuInitiallyKeyboardFocused}
        onEscKeyDown={this._handleMenuEscKeyDown}
        onItemTouchTap={this._handleItemTouchTap}
        openDirection={openDirection}
        style={mergedMenuStyles}>
        {children}
      </Menu>
    ) : null;

    return (
      <div
        className={className}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseEnter={onMouseEnter}
        onMouseUp={onMouseUp}
        onTouchTap={onTouchTap}
        style={mergedRootStyles}>
        {iconButton}
        {menu}
      </div>
    );
  },

  isOpen() {
    return this.state.open;
  },

  close(isKeyboard) {
    if (this.props.isOpen) {
      this.props.close(() => {
        //Set focus on the icon button when the menu close
        if (isKeyboard) {
          let iconButton = this.refs[this.state.iconButtonRef];
          const node = ReactDOM.findDOMNode(iconButton);
          node && node.focus();
          iconButton.setKeyboardFocus && iconButton.setKeyboardFocus();
        }
      });
    }

    //if (this.state.open) {
    //  this.setState({open: false}, () => {
    //    //Set focus on the icon button when the menu close
    //    if (isKeyboard) {
    //      let iconButton = this.refs[this.state.iconButtonRef];
    //      ReactDOM.findDOMNode(iconButton).focus();
    //      iconButton.setKeyboardFocus();
    //    }
    //  });
    //}
  },

  open(menuInitiallyKeyboardFocused) {
    if (!this.props.isOpen) {
      this.props.open();
      this.setState({ menuInitiallyKeyboardFocused });
    }

    //if (!this.state.open) {
    //  this.setState({
    //    open: true,
    //    menuInitiallyKeyboardFocused: menuInitiallyKeyboardFocused,
    //  });
    //}
  },

  _handleItemTouchTap(e, child) {

    if (this.props.closeOnItemTouchTap) {
      let isKeyboard = Events.isKeyboard(e);

      this._timeout = setTimeout(() => {
        this.close(isKeyboard);
      }, this.props.touchTapCloseDelay);
    }

    this.props.onItemTouchTap(e, child);
  },

  _handleMenuEscKeyDown() {
    this.close(true);
  },

});

module.exports = IconMenu;
