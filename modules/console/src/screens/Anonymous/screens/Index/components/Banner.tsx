import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Wrapper from '../../../../../components/Wrapper';

import * as Colors from 'material-ui/styles/colors';
import Card from 'material-ui/Card/Card';
import CardActions from 'material-ui/Card/CardActions';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import FlatButton from 'material-ui/FlatButton';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../../constants/Messages';

const messages = defineMessages({
  bannerTitle: {
    id: 'landing.banner.title',
    description: 'Landing page banner title',
    defaultMessage: 'Buffy the Virtual Robot Platform',
  },
  seeMore: {
    id: 'landing.seeMore',
    description: 'Landing page see more button label',
    defaultMessage: 'See more',
  },
});

const backgroundImageUrl = require('file!../assets/landing.png');

const styles = {
  buttons: {
    float: 'right',
  },
  button: {
    color: Colors.white,
  },
};

interface BannerProps extends React.Props<Banner> {
  intl?: InjectedIntlProps;
  dispatch?: Dispatch;
}

@injectIntl
@connect()
class Banner extends React.Component<BannerProps, {}> {
  handleInfoButtonClick() {
    this.props.dispatch(push('/features'));
  }

  render() {
    return (
      <Wrapper backgroundColor={Colors.pink50}>
        <Card>
          <CardMedia
            overlay={
              <div>
                <CardTitle titleColor={Colors.white} title={this.props.intl.formatMessage(messages.bannerTitle)} />
                <CardActions style={styles.buttons}>
                  <FlatButton label={this.props.intl.formatMessage(messages.seeMore)}
                              style={styles.button}
                              onTouchTap={() => this.handleInfoButtonClick()}
                  />
                </CardActions>
              </div>
            }
          >
            <img src={backgroundImageUrl} />
          </CardMedia>
        </Card>
      </Wrapper>
    );
  }
}

export default Banner;
