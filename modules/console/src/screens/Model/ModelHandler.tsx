import * as React from 'react';
import { Link } from 'react-router';
import Card from 'material-ui/Card/Card';
import CardActions from 'material-ui/Card/CardActions';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import CardText from 'material-ui/Card/CardText';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import { white } from 'material-ui/styles/colors';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Wrapper from '../../components/Wrapper';
import ModelList from './components/ModelList';

import {
  ModelFileDocument,
} from '../../types';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

const bannerImgUrl = require('file!./banner.jpg');

const styles = {
  buttons: {
    float: 'right',
  },
  button: {
    color: white,
  },
};

const messages = defineMessages({
  bannerTitle: {
    id: 'landing.banner.title',
    description: 'Landing page banner title',
    defaultMessage: 'Buffy the Voxel Editor',
  },
});

interface HandlerProps {
  recentModels?: ApiCall<ModelFileDocument[]>;
  intl?: InjectedIntlProps
}

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

@preloadApi(() => ({
  recentModels: get(`${CONFIG_API_SERVER_URL}/files`),
}))
@connectApi()
@injectIntl
class ModelHandler extends React.Component<HandlerProps, {}> {
  render() {
    return (
      <div className="row">
        <div className={rootClass}>
          <Card>
            <CardMedia
              overlay={
                <div>
                  <CardTitle
                    title={this.props.intl.formatMessage(messages.bannerTitle)}
                    titleColor={white}
                    subtitle="Create a 3D model using blocks"
                    subtitleColor={white}
                  />
                </div>
              }
            >
              <img src={bannerImgUrl} />
            </CardMedia>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <RaisedButton
              containerElement={<Link to="/model/edit" />}
              label="Create a New Model"
              secondary={true}
            />
          </div>
          <div>
            <h2>Most forked models</h2>
            <hr />
          </div>
          <div>
            <h2>Recently updated models</h2>
            <hr />
            <ModelList
              courses={this.props.recentModels.result}
              fetching={this.props.recentModels.state !== 'fulfilled'}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ModelHandler;
