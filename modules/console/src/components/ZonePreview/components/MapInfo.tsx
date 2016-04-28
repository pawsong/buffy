import * as React from 'react';
import { EventEmitter, EventSubscription } from 'fbemitter';

const styles = {
  info: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'white',
  },
};

interface MapInfoProps extends React.Props<MapInfo> {
  mapName: string;
}

class MapInfo extends React.Component<MapInfoProps, {
  mapName: string;
}> {
  render() {
    return (
      <div>
        <div style={styles.info}>Map: {this.props.mapName}</div>
      </div>
    );
  }
}

export default MapInfo;
