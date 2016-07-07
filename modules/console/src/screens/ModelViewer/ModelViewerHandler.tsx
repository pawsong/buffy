import * as React from 'react';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { RouteComponentProps, Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import RaisedButton from 'material-ui/RaisedButton';
// import FlatButton from 'material-ui/FlatButton';
const FlatButton = require('material-ui/FlatButton').default;
import { cyan500, cyan200, fullWhite } from 'material-ui/styles/colors';
import { preloadApi, connectApi, ApiCall, get } from '../../api';
import { call } from 'redux-saga/effects';
import { saga, SagaProps, ImmutableTask, isDone, request } from '../../saga';
import deserialize from '../../components/ModelEditor/utils/deserialize';
import { FileState as ModelFileState } from '../../components/ModelEditor/types';
import Fork from '../../components/icons/Fork';

import {
  EnhancedTitle,
  MetaImage,
  MetaUrl,
} from '../../hairdresser';

import getForkItemLabel from '../../utils/getForkItemLabel';

import ModelViewer from './components/ModelViewer';

const styles = require('./ModelViewerHandler.css');

import {
  ModelFileDocument,
  MaterialMapType,
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

  renderBody(model: ModelFileDocument) {
    if (!model || !isDone(this.props.loadModel)) {
      return this.renderLoading();
    }

    let user = null;
    if (model.owner) {
      user = (
        <div className={styles.fork} style={{ display: 'inline-block', paddingBottom: 0, marginLeft: 5 }}>
          by <Link to={`/@${model.owner.username}`}>{model.owner.username}</Link>
        </div>
      );
    }

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
          <div style={{ float: 'right' }}>
            <FlatButton
              backgroundColor={cyan500}
              hoverColor={cyan200}
              style={{
                minWidth: 0,
                color: fullWhite,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              labelStyle={{ paddingLeft: 12, paddingRight: 12 }}
              label={'fork'}
              icon={<Fork color={fullWhite} style={{ width: 18, height: 18 }}/>}
              containerElement={<Link to={`/model/edit?files=${model.id}`} />}
            />
            <FlatButton
              backgroundColor={cyan500}
              hoverColor={cyan200}
              style={{
                minWidth: 0,
                color: fullWhite,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              labelStyle={{ paddingLeft: 12, paddingRight: 12 }}
              label={`${model.forked}`}
              onTouchTap={() => alert('Sorry, this feature is under construction')}
              containerElement={<a />}
            />
          </div>
          <h1 style={{ display: 'inline-block' }}>{this.props.model.result.name}</h1>
          {user}
          {fork}
        </div>
        <ModelViewer
          data={this.props.loadModel.result.present.data.maps[MaterialMapType.DEFAULT]}
        />
      </div>
    );
  }

  render() {
    const model = this.props.model.result;

    let head = null;
    if (model) {
      const title = model.owner ? `${model.name} by ${model.owner.username}` : model.name;
      head = (
        <div>
          <EnhancedTitle>{title}</EnhancedTitle>
          <MetaImage url={`${__CDN_BASE__}/${model.thumbnail}`} />
        </div>
      );
    }

    return (
      <div className={rootClass}>
        {head}
        <MetaUrl url={`${__BASE__}${this.props.location.pathname}`} />
        {this.renderBody(model)}
      </div>
    );
  }
}

export default ModelViewerHandler;
