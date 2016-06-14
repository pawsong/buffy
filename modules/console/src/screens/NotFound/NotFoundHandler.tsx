import * as React from 'react';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

class NotFoundHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div className={rootClass}>
        <h1>Sorry</h1>
        <div>This page is not what you are looking for.</div>
      </div>
    );
  }
}

export default NotFoundHandler;
