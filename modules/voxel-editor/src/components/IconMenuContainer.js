import React from 'react';

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
    let childIconMenuIndex = 0;
    return React.Children.map(this.props.children, child => {
      if (child.type.displayName === 'IconMenu') {
        const iconMenuIndex = childIconMenuIndex++;
        return React.cloneElement(child, {
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
