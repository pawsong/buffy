import * as React from 'react';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { RouteComponentProps, Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import { preloadApi, connectApi, ApiCall, get } from '../../api';
import { call } from 'redux-saga/effects';
import { saga, SagaProps, ImmutableTask, isDone, request } from '../../saga';
import deserialize from '../../components/ModelEditor/utils/deserialize';
import { FileState as ModelFileState } from '../../components/ModelEditor/types';

import getForkItemLabel from '../../utils/getForkItemLabel';

import ModelViewer from './components/ModelViewer';

const styles = require('./ModelViewerHandler.css');

import {
  ModelFileDocument,
} from '../../types';

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  model?: ApiCall<ModelFileDocument>;
  loadModel?: ImmutableTask<ModelFileState>;
  intl?: InjectedIntlProps
}

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

const contentClass = [
  'col-xs-12',
  'col-md-8',
].join(' ');

@preloadApi<RouteParams>((params) => ({
  model: get(`${CONFIG_API_SERVER_URL}/files/${params.modelId}`, {
    qs: { sort: '-forked' },
  }),
}))
@connectApi()
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
@withStyles(styles)
class ModelViewerHandler extends React.Component<HandlerProps, {}> {
  componentDidMount() {
    this.props.runSaga(this.props.loadModel, this.props.params.modelId);
  }

  renderLoading() {
    return (
      <div>Loading...</div>
    );
  }

  renderBody() {
    if (this.props.model.state !== 'fulfilled' || !isDone(this.props.loadModel)) {
      return this.renderLoading();
    }

    const model = this.props.model.result;

    let fork = null;
    if (model.forkParent) {
      fork = (
        <div className={styles.fork}>
          forked from <Link to={`/model/${model.forkParent.id}`}>{getForkItemLabel(model.forkParent)}</Link>
        </div>
      );
    }

    return (
      <div>
        <div className={styles.title}>
          <h1>{this.props.model.result.name}</h1>
          {fork}
        </div>
        <ModelViewer
          data={this.props.loadModel.result.present.data.model}
        />
      </div>
    );
  }

  render() {
    return (
      <div className={rootClass}>{this.renderBody()}</div>
    );
  }
}

export default ModelViewerHandler;
