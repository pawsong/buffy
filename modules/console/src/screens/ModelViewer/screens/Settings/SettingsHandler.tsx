import React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import {Card, CardActions, CardTitle, CardText} from 'material-ui/Card';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import {call} from 'redux-saga/effects';
import { preloadApi, connectApi, ApiCall, get, ApiDispatchProps } from '../../../../api';
import { saga, SagaProps, ImmutableTask, wait, isRunning, request } from '../../../../saga';

const styles = require('./SettingsHandler.css');

import {
  ModelFileDocument,
} from '../../../../types';

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, ApiDispatchProps, SagaProps {
  model?: ApiCall<ModelFileDocument>;
  changeName?: ImmutableTask<any>;
  changeVisibility?: ImmutableTask<any>;
}

interface HandlerState {
  filename: string;
}

@connectApi<HandlerProps>((state, props) => ({
  model: get(`${CONFIG_API_SERVER_URL}/files/${props.params.modelId}`),
}))
@saga({
  changeName: function* (modelId: string, name: string, callback: () => any) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/files/${modelId}`, {name});
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    callback();
  },
  changeVisibility: function* (modelId: string, isPublic: boolean, callback: () => any) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/files/${modelId}`, {isPublic});
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    callback();
  },
})
@withStyles(styles)
class SettingsHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props: HandlerProps) {
    super(props);
    this.state = {
      filename: props.model.result.name,
    };
  }

  handleNameTextChange = (e: React.FormEvent) => this.setState({ filename: e.target['value'] });

  handleChangeNameRequest = () => {
    const model = this.props.model.result;
    this.props.runSaga(this.props.changeName, model.id, this.state.filename, () => {
      this.props.request(this.props.model);
    });
  }

  handleChangeVisibilityRequest = () => {
    const model = this.props.model.result;
    this.props.runSaga(this.props.changeVisibility, model.id, !model.isPublic, () => {
      this.props.request(this.props.model);
    });
  }

  render() {
    const model = this.props.model.result;

    const visibilityLabel = model.isPublic ? 'Make Private' : 'Make Public';

    return (
      <div>
        <h2>Settings</h2>
        <div className={styles.item}>
          <Card>
            <CardTitle title="File Name" />
            <CardText>
              <TextField
                hintText="Type the new name"
                value={this.state.filename}
                onChange={this.handleNameTextChange}
              />
            </CardText>
            <CardActions style={styles.buttons}>
              <FlatButton
                label={'Rename'}
                primary={true}
                onTouchTap={this.handleChangeNameRequest}
                disabled={!this.state.filename || this.state.filename === model.name || isRunning(this.props.changeName)}
              />
            </CardActions>
          </Card>
        </div>
        <div className={styles.item}>
          <Card>
            <CardTitle title={visibilityLabel} />
            {model.isPublic ? this.renderMakePrivateDesc() : this.renderMakePublicDesc()}
            <CardActions style={styles.buttons}>
              <FlatButton
                label={visibilityLabel}
                primary={true}
                onTouchTap={this.handleChangeVisibilityRequest}
                disabled={isRunning(this.props.changeVisibility)}
              />
            </CardActions>
          </Card>
        </div>
      </div>
    );
  }

  renderMakePublicDesc() {
    return (
      <CardText>
        <span>Anyone can see this model. The model will be licensed under </span>
        <a target="_blank" href="http://choosealicense.com/licenses/cc-by-4.0/">cc-by-4.0</a>
      </CardText>
    );
  }

  renderMakePrivateDesc() {
    return (
      <CardText>
        <span>Nobody can see this model except you.</span>
      </CardText>
    );
  }
}

export default SettingsHandler;
