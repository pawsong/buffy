import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Link } from 'react-router';
import {
  requestZoneConnect,
} from '../../actions/zone';
import { State } from '../../reducers';
import { UnitHandlerRouteParams } from '../Course/screens/Unit';
import Studio from '../../containers/Studio';

interface StudioForCourseHandlerRouteParams extends UnitHandlerRouteParams {}
interface StudioForCourseHandlerParams extends StudioForCourseHandlerRouteParams {}
interface StudioForCourseHandlerProps extends RouteComponentProps<StudioForCourseHandlerParams, StudioForCourseHandlerRouteParams> {
  stateLayer: StateLayer;
  requestZoneConnect: () => any;
}

const NAVBAR_SIZE = 60;

const styles = {
  navbar: {
    height: NAVBAR_SIZE,
  },
  studio: {
    position: 'absolute',
    top: NAVBAR_SIZE,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

@connect((state: State) => ({
  stateLayer: state.zone.stateLayer,
}), {
  requestZoneConnect,
})
class StudioForCourseHandler extends React.Component<StudioForCourseHandlerProps, {}> {
  componentDidMount() {
    // Request zone server connection
    this.props.requestZoneConnect();
  }

  render() {
    return (
      <div>
        <div style={styles.navbar}>
          Draw navbar somehow
        </div>
        <Studio stateLayer={this.props.stateLayer} style={styles.studio} />
      </div>
    );
  }
}

export default StudioForCourseHandler;
