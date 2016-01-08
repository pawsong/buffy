import * as React from 'react';
const objectAssign: any = require('object-assign');

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

interface IHairdresserProvider {
  (): void;
  propTypes: any;
  childContextTypes: any;
}

export function provideHairdresserContext(Component): any {
  
  // Extend existing component.
  const HairdresserProvider: IHairdresserProvider = function() {
    Component.apply(this, arguments);  
  } as IHairdresserProvider;

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

export interface HdTitleProps extends React.Props<HdTitle> {
}

export class HdTitle extends React.Component<HdTitleProps, {}> {
  static contextTypes: any;
  override: any;
  context: any;
  
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

function createEtcClass<T, S>(displayName, tagName) {
  return React.createClass<T, S>({
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

interface HdElementProps extends React.Props<{}> {
  selector: any;
  attrs: any;
}

export const HdMeta = createEtcClass<HdElementProps, {}>('HdMeta', 'meta');
export const HdLink = createEtcClass<HdElementProps, {}>('HdLink', 'link');
