import React from 'react';
import { RouteComponentProps } from 'react-router';
import ModelSettings from '../../../../containers/ModelSettings';

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
}

class SettingsHandler extends React.Component<HandlerProps, void> {
  render() {
    return (
      <ModelSettings
        modelId={this.props.params.modelId}
      />
    );
  }
}

export default SettingsHandler;
