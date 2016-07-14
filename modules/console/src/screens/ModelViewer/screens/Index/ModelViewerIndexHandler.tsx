import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import { call } from 'redux-saga/effects';
import { saga, SagaProps, ImmutableTask, isDone, request } from '../../../../saga';
import { deserialize } from '../../../../components/ModelEditor/utils/serdez';
import { FileState as ModelFileState } from '../../../../components/ModelEditor/types';

import ModelViewer from './components/ModelViewer';

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  loadModel?: ImmutableTask<ModelFileState>;
}

@saga({
  loadModel: function* (modelId) {
    const response = yield call(request.get, `${__S3_BASE__}/files/${modelId}`, {
      responseType: 'arraybuffer',
      withCredentials: false,
    });

    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    const doc = response.data;
    const fileState = deserialize(new Uint8Array(response.data));

    return fileState;
  },
})
class ModelViewerIndexHandler extends React.Component<HandlerProps, void> {
  loadModel() {
    this.props.runSaga(this.props.loadModel, this.props.params.modelId);
  }

  componentDidMount() {
    this.loadModel();
  }

  componentDidUpdate(prevProps: HandlerProps) {
    if (prevProps.location !== this.props.location) this.loadModel();
  }

  renderLoading() {
    return (
      <div>Loading...</div>
    );
  }

  render() {
    if (!isDone(this.props.loadModel)) return this.renderLoading();

    return (
      <ModelViewer
        fileState={this.props.loadModel.result}
      />
    );
  }
}

export default ModelViewerIndexHandler;
