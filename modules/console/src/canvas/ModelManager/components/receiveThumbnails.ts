import * as React from 'react';
import * as Immutable from 'immutable';

const hoistStatics = require('recompose/hoistStatics').default;

import ModelManager from '../ModelManager';

interface HigherOrderComponentProps extends React.Props<any> {
  modelManager: ModelManager;
}

interface HigherOrderComponentState {
  modelThumbnails: Immutable.Map<string, string>;
}

function receiveThumbnails() {
  return hoistStatics(WrappedComponent => {
    class HigherOrderComponent extends React.Component<HigherOrderComponentProps, HigherOrderComponentState> {
      static propTypes = {
        modelManager: React.PropTypes.object.isRequired,
      };

      boundSubscribeThumbnails: () => any;

      constructor(props: HigherOrderComponentProps) {
        super(props);
        this.state = {
          modelThumbnails: this.props.modelManager.thumbnails,
        };
      }

      subscribeThumbnails() {
        if (this.state.modelThumbnails !== this.props.modelManager.thumbnails) {
          this.setState({ modelThumbnails: this.props.modelManager.thumbnails });
        }
      }

      componentDidMount() {
        this.boundSubscribeThumbnails = this.subscribeThumbnails.bind(this);
        this.props.modelManager.subscribeThumbnails(this.boundSubscribeThumbnails);
      }

      componentWillUnmount() {
        this.props.modelManager.unsubscribeThumbnails(this.boundSubscribeThumbnails);
        this.boundSubscribeThumbnails = null;
      }

      render() {
        const mergedProps = Object.assign({}, this.props, { modelThumbnails: this.state.modelThumbnails });
        return React.createElement(WrappedComponent, mergedProps);
      }
    }

    return HigherOrderComponent;
  });
}

export interface ReceiveThumbnailsProps {
  modelManager: ModelManager;
  modelThumbnails?: Immutable.Map<string, string>;
}

interface DecoratorFactory {
  (): <T>(Component: T) => T;
}

export default <DecoratorFactory>receiveThumbnails;
