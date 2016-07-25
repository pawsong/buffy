import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

interface HandlerProps {
  channels: ApiCall<any>;
}

@preloadApi(() => ({
  channels: get('https://download.buffy.run/api/channels'),
}))
@connectApi()
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
        <div className="row">
          <div className="col-xs">
            <h1>Meet Truffy</h1>
            <div>Trove Creation Made Easy</div>
          </div>
          <div className="col-xs">
            <RaisedButton
              label="Get Truffy"
              href={link}
              primary={true}
              disabled={!link}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default TruffyHandler;
