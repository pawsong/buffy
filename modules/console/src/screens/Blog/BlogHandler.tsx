import React from 'react';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

class BlogHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div className={rootClass}>
        {this.props.children}
      </div>
    );
  }
}

export default BlogHandler;
