import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Link } from 'react-router';

import Studio from '../../../containers/Studio';

interface StudioForCourseBodyProps extends React.Props<StudioForCourseBody> {
  stateLayer: StateLayer;
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

class StudioForCourseBody extends React.Component<StudioForCourseBodyProps, {}> {
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

export default StudioForCourseBody;
