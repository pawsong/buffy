import React from 'react';

const StylePropable = require('material-ui/lib/mixins/style-propable');

const IconMenuContainer = {
  getInitialState () {
    return {
      childIconMenuIndex: -1,
    };
  },

  closeChildIconMenu(callback) {
    if (this.state.childIconMenuIndex !== -1) {
      this.setState({ childIconMenuIndex: -1 }, callback);
    }
  },

  bindChildren() {
    const styles = {
      root: { display: 'block' },
      menu: { top: 0, left: '100%' },
    };

    let childIconMenuIndex = 0;
    return React.Children.map(this.props.children, child => {
      if (child.type.displayName && child.type.displayName.indexOf('IconMenu') >= 0) {
        const iconMenuIndex = childIconMenuIndex++;
        return React.cloneElement(child, {
          style: StylePropable.mergeStyles(styles.root, this.props.iconMenuStyle),
          menuStyle: StylePropable.mergeStyles(styles.menu, this.props.iconMenuMenuStyle),
          open: () => this.setState({ childIconMenuIndex: iconMenuIndex }),
          close: (callback) => this.closeChildIconMenu(callback),
          closeContainer: () => this.props.close || this.props.close(),
          isOpen: this.state.childIconMenuIndex === iconMenuIndex,
        });
      }

      return React.cloneElement(child, {
        onMouseEnter: () => this.closeChildIconMenu(),
      });
    });
  },
};

export default IconMenuContainer;
