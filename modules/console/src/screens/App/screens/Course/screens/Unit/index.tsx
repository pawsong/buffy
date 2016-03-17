import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Link } from 'react-router';
import RaisedButton = require('material-ui/lib/raised-button');
import {
  requestZoneConnect,
} from '../../../../../../actions/zone';
import { State } from '../../../../../../reducers';

import { CourseHandlerRouteParams } from '../../';

import Wrapper from '../../../../../../components/Wrapper';

export interface UnitHandlerRouteParams extends CourseHandlerRouteParams {
  unitIndex: string;
}

interface UnitHandlerParams extends UnitHandlerRouteParams {}
interface UnitHandlerProps extends RouteComponentProps<UnitHandlerParams, UnitHandlerRouteParams> {
}

@connect((state: State) => ({
}))
class UnitHandler extends React.Component<UnitHandlerProps, {}> {
  render() {
    const { courseId, unitIndex } = this.props.params;
    return (
      <div>
        <Wrapper>
          <Link to={`/courses/${courseId}`}>Back to course...</Link>
          <h1>Unit {unitIndex}</h1>
          <p>Let's do something</p>
          <RaisedButton label="Let's play!" secondary={true} linkButton={true}
                        containerElement={<Link to={`/courses/${courseId}/units/${unitIndex}/play`}/>}
          />
        </Wrapper>
      </div>
    );
  }
}

export default UnitHandler;
