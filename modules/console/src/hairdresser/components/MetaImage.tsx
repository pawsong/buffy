import React, { Props, PropTypes } from 'react';
import Meta from './Meta';

interface MetaImageProps extends Props<Meta> {
  url: string;
}

class MetaImage extends React.Component<MetaImageProps, void> {
  static propTypes = {
    url: PropTypes.string.isRequired,
  };

  render() {
    return (
      <Meta attrs={{
        property: 'og:image',
        itemprop: 'image primaryImageOfPage',
      }} values={{
        content: this.props.url,
      }} />
    );
  }
}

export default MetaImage;
