declare const require;

import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';
const hoistStatics = require('hoist-non-react-statics');

export class ElementClass extends React.Component<any, any> { }
export interface ClassDecorator {
  <T extends (typeof ElementClass)>(component: T): T
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function connect(): ClassDecorator {
  return function wrapWithConnect(WrappedComponent) {
    class Connect extends React.Component<{}, {}> {
      static displayName = `StateLayer.connect(${getDisplayName(WrappedComponent)})`;

      static WrappedComponent = WrappedComponent;

      static contextTypes ={
        stateLayer: React.PropTypes.any,
      }

      stateLayer: StateLayer;

      constructor(props, context) {
        super(props, context);
        this.stateLayer = context.stateLayer;
      }

      render() {
        return <WrappedComponent {...this.props} stateLayer={this.stateLayer}/>
      }
    }
    return hoistStatics(Connect, WrappedComponent)
  }
}

export default connect;
