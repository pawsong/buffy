import * as React from 'react';

const buffyHeart = require('!file!./buffy_love.jpeg');

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

class AboutHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div className={rootClass}>
        <img src={buffyHeart} />
        <div>Buffy is a toolset that helps people make digital contents.</div>
      </div>
    );
  }
}

export default AboutHandler;
