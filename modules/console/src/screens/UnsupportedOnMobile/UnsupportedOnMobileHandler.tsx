import React from 'react';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

class UnsupportedOnMobileHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div className={rootClass}>
        <h1>Sorry</h1>
        <p>This page is not supported for mobile browsers just yet :(</p>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <RaisedButton
            label={'Go explore'}
            primary={true}
            containerElement={<Link to="/" />}
          />
        </div>
      </div>
    );
  }
}

export default UnsupportedOnMobileHandler;
