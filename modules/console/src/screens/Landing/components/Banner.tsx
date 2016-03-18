import * as React from 'react';
import Wrapper from '../../../components/Wrapper';

import Colors from 'material-ui/lib/styles/colors';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardTitle from 'material-ui/lib/card/card-title';
import FlatButton from 'material-ui/lib/flat-button';
import CardText from 'material-ui/lib/card/card-text';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

const messages = defineMessages({
  bannerTitle: {
    id: 'landing.banner.title',
    description: 'Landing page banner title',
    defaultMessage: 'Great physical computing courses without real devices',
  },
  seeMore: {
    id: 'landing.seeMore',
    description: 'Landing page see more button label',
    defaultMessage: 'See more',
  },
});

const backgroundImageUrl = require('file!../assets/banner_bg.png');

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
}

@injectIntl
class Banner extends React.Component<BannerProps, {}> {
  handleInfoButtonClick() {
    console.log('Show more info');
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
