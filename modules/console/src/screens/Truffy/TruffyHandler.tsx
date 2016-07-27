import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

const screenshot = require('file!./temp.png');

import { preloadApi, connectApi, ApiCall, get } from '../../api';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./TruffyHandler.css');

import { EnhancedTitle } from '../../hairdresser';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
  styles.root,
].join(' ');

interface HandlerProps {
  channels: ApiCall<any>;
}

@preloadApi(() => ({
  channels: get('https://download.buffy.run/api/channels'),
}))
@connectApi()
@withStyles(styles)
class TruffyHandler extends React.Component<HandlerProps, {}> {
  static contextTypes = {
    isMac: React.PropTypes.bool.isRequired,
  };

  getInstallerLink() {
    const channels = this.props.channels.result;
    if (!channels) return;

    const { isMac } = this.context as any;

    // TODO: Handle linux
    if (isMac) {
      return `http://download-cdn.buffy.run/download/version/${channels.stable.latest}/osx`;
    } else {
      return `http://download-cdn.buffy.run/download/version/${channels.stable.latest}/win`;
    }
  }

  render() {
    const link = this.getInstallerLink();

    return (
      <div className={rootClass}>
        <EnhancedTitle>Meet Truffy</EnhancedTitle>
        <div className="row">
          <div className={`col-xs ${styles.leftPane}`}>
            <div className={styles.header}>
              <h1>Truffy</h1>
              <div className={styles.sub}>Trove Creation Made Easy</div>
              <div className={styles.desc}>
                Truffy is a desktop app that enables Buffy's special features for Trove Creation.
              </div>
            </div>
            <div className={styles.downloadButton}>
              <RaisedButton
                label="Get Truffy"
                href={link}
                primary={true}
                disabled={!link}
              />
              <div className={styles.learnMore}>
                <a href="/blog/trove-creation-made-easy" target="_blank">Learn more</a>
              </div>
            </div>
          </div>
          <div className={`col-xs ${styles.rightPane}`}>
            <img src={screenshot} />
          </div>
        </div>
      </div>
    );
  }
}

export default TruffyHandler;
