import React from 'react';
import objectAssign from 'object-assign';

/**
 * The Hairdresser mixin provides a convenient way for
 * components to set the hairdresser in context.
 */
export const Hairdresser = {
  propTypes: {
    hairdresser: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    hairdresser: React.PropTypes.object.isRequired
  },

  getChildContext() {
    return {
      route: this.props.hairdresser,
    }
  }
}

export function provideHairdresserContext(Component) {
  // Extend existing component.
  function HairdresserProvider() {
    Component.apply(this, arguments);
  }
  HairdresserProvider.prototype = Object.create(Component.prototype);
  HairdresserProvider.prototype.constructor = HairdresserProvider;

  HairdresserProvider.propTypes = objectAssign({}, Component.propTypes, {
    hairdresser: React.PropTypes.object.isRequired,
  });

  HairdresserProvider.childContextTypes = objectAssign({}, Component.childContextTypes, {
    hairdresser: React.PropTypes.object.isRequired,
  });

  if (Component.prototype.getChildContext) {
    HairdresserProvider.prototype.getChildContext = function () {
      return objectAssign(Component.prototype.getChildContext.apply(this, arguments), {
        hairdresser: this.props.hairdresser,
      });
    };
  } else {
    HairdresserProvider.prototype.getChildContext = function () {
      return { hairdresser: this.props.hairdresser };
    };
  }
  return HairdresserProvider;
}

export class HdTitle extends React.Component {
  componentWillMount() {
    this.override = this.context.hairdresser.override().title(() => {
      return String(this.props.children || '');
    });
  }

  componentDidUpdate() {
    this.override.update();
  }

  componentWillUnmount() {
    this.override.restore();
  }

  render() {
    return null;
  }
}

HdTitle.contextTypes = {
  hairdresser: React.PropTypes.object.isRequired,
};

function createEtcClass(displayName, tagName) {
  return React.createClass({
    displayName,

    propTypes: {
      selector: React.PropTypes.object.isRequired,
      attrs: React.PropTypes.object.isRequired,
    },

    contextTypes: {
      hairdresser: React.PropTypes.object.isRequired,
    },

    componentWillMount() {
      this.override = this.context.hairdresser.override();
      this.override[tagName](this.props.selector, () => {
        return typeof this.props.attrs === 'object' ? this.props.attrs : {};
      });
    },

    componentDidUpdate() {
      this.override.update();
    },

    componentWillUnmount() {
      this.override.restore();
    },

    render: function() {
      return null;
    },
  });
}

export const HdMeta = createEtcClass('HdMeta', 'meta');
export const HdLink = createEtcClass('HdLink', 'link');
