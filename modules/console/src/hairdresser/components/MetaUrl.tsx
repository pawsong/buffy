import React, { Props, PropTypes } from 'react';
import Meta from './Meta';

interface MetaUrlProps extends Props<Meta> {
  url: string;
}

class MetaUrl extends React.Component<MetaUrlProps, void> {
  static propTypes = {
    url: PropTypes.string.isRequired,
  };

  render() {
    return (
      <Meta
        attrs={{ property: 'og:url' }}
        values={{ content: this.props.url }}
      />
    );
  }
}

export default MetaUrl;
