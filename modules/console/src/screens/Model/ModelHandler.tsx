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
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import ModelList from '../../components/ModelList';

import {
  ModelFileDocument,
} from '../../types';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

const bannerImgUrl = require('file!./banner.jpg');
const styles = require('./ModelHandler.css');

const messages = defineMessages({
  bannerTitle: {
    id: 'landing.banner.title',
    description: 'Landing page banner title',
    defaultMessage: 'Buffy the Voxel Editor',
  },
});

interface HandlerProps {
  mostLikedModels?: ApiCall<ModelFileDocument[]>;
  mostForkedModels?: ApiCall<ModelFileDocument[]>;
  recentModels?: ApiCall<ModelFileDocument[]>;
  intl?: InjectedIntlProps
}

const rootClass = [
  'col-xs-12',
  'col-md-8',
].join(' ');

@preloadApi(() => ({
  mostLikedModels: get(`${CONFIG_API_SERVER_URL}/files`, {
    qs: { sort: '-likeCount' },
  }),
  mostForkedModels: get(`${CONFIG_API_SERVER_URL}/files`, {
    qs: { sort: '-forked' },
  }),
  recentModels: get(`${CONFIG_API_SERVER_URL}/files`),
}))
@connectApi()
@injectIntl
@withStyles(styles)
class ModelHandler extends React.Component<HandlerProps, {}> {
  render() {
    return (
      <div className="row center-xs" style={{ margin: 0, textAlign: 'inherit' }}>
        <div className={rootClass} style={{ padding: 0 }}>
          <Card style={{ marginBottom: 30 }}>
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
          <div style={{ textAlign: 'center', marginTop: 60, marginBottom: 60 }}>
            <RaisedButton
              containerElement={<Link to="/model/edit" />}
              label="Create a New Model"
              secondary={true}
            />
          </div>
          <div>
            <h2 className={styles.subtitle}>Most liked models</h2>
            <ModelList
              files={this.props.mostLikedModels.result}
            />
          </div>
          <div>
            <h2 className={styles.subtitle}>Most forked models</h2>
            <ModelList
              files={this.props.mostForkedModels.result}
            />
          </div>
          <div>
            <h2 className={styles.subtitle}>Recently updated models</h2>
            <ModelList
              files={this.props.recentModels.result}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ModelHandler;
