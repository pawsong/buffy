import * as React from 'react';
import Wrapper from '../../../components/Wrapper';

import Colors = require('material-ui/lib/styles/colors');

import Card = require('material-ui/lib/card/card');
import CardActions = require('material-ui/lib/card/card-actions');
import CardHeader = require('material-ui/lib/card/card-header');
import CardMedia = require('material-ui/lib/card/card-media');
import CardTitle = require('material-ui/lib/card/card-title');
const FlatButton = require('material-ui/lib/flat-button');
import CardText = require('material-ui/lib/card/card-text');

const backgroundImageUrl = require('file!../assets/banner_bg.png');


const styles = {
  buttons: {
    float: 'right',
  },
  button: {
    color: Colors.white,
  },
};

class Banner extends React.Component<{}, {}> {
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
                <CardTitle titleColor={Colors.white} title="Great physical computing courses without real devices" />
                <CardActions style={styles.buttons}>
                  <FlatButton label="See more" style={styles.button} onTouchTap={() => this.handleInfoButtonClick()}/>
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
