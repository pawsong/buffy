import React from 'react';
import { Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import RaisedButton from 'material-ui/RaisedButton';

const styles = require('./DesignTutorialIndex.css');

const screenshot = require('file!./screenshot.jpg');

const rootClass = [
  'col-xs-12',
  'col-md-offset-2', 'col-md-8',
  styles.root,
].join(' ');

@withStyles(styles)
class DesignTutorialIndex extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <div className={rootClass}>
          <h1>Buffy Designer Tutorial</h1>
          <div className={styles.banner}>
            <img src={screenshot} />
          </div>
          <div>
            This tutorial introduces basic features of <b>Buffy Designer</b>,
            the tool for creating 3D models with cubes.
          </div>
          <div className={styles.startButtonWrapper}>
            <RaisedButton
              className={styles.startButton}
              label={'Start tutorial'}
              primary={true}
              containerElement={
                <Link to="/tutorial/designer/make-your-first-model" />
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DesignTutorialIndex;
