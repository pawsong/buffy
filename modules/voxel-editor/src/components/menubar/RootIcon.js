import React from 'react';

const StylePropable = require('material-ui/lib/mixins/style-propable');

const RootIcon = React.createClass({
  mixins: [StylePropable],

  render() {
    const {
      style,
      ...other
    } = this.props;

    const styles = {
      root: {
        padding: '3px 5px',
        margin: '5px 2px',
        cursor: 'pointer',
      },
    };

    const mergedStyles = this.mergeStyles(styles.root, style);
    return <div style={mergedStyles} {...other}>{this.props.children}</div>;
  },
});

export default RootIcon;
