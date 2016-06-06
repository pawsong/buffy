import * as React from 'react';

import * as Colors from 'material-ui/styles/colors';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Wrapper.css');

interface WrapperProps extends React.Props<Wrapper> {
  className?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
  width?: number | string;
}

@withStyles(styles)
class Wrapper extends React.Component<WrapperProps, {}> {
  render() {
    const rootStyle = Object.assign({}, {
      backgroundColor: this.props.backgroundColor || Colors.white
    }, this.props.style);

    const innerStyle = {
      width: this.props.width || 980,
    };

    return (
      <div style={rootStyle} className={this.props.className || ''}>
        <div className={styles.inner} style={innerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Wrapper;
