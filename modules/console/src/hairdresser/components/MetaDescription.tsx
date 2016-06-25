import React, { Props, PropTypes } from 'react';
import Meta from './Meta';

interface MetaDescriptionProps extends Props<Meta> {
}

class MetaDescription extends React.Component<MetaDescriptionProps, void> {
  static propTypes = {
    url: PropTypes.string.isRequired,
  };

  render() {
    return (
      <Meta
        attrs={{
          name: 'twitter:description',
          property: 'og:description',
          itemprop: 'description',
        }}
        values={{
          content: this.props.children
        }}
      />
    );
  }
}

export default MetaDescription;
