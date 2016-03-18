import * as React from 'react';
const objectAssign = require('object-assign');
const Radium = require('radium');

import Colors from 'material-ui/lib/styles/colors';

const styles = {
  inner: {
    marginRight: 'auto',
    marginLeft: 'auto',
  },
}

interface WrapperProps extends React.Props<Wrapper> {
  backgroundColor?: string;
  style?: React.CSSProperties;
  width?: number;
}

@Radium
class Wrapper extends React.Component<WrapperProps, {}> {
  render() {
    const rootStyle = objectAssign({}, {
      backgroundColor: this.props.backgroundColor || Colors.white
    }, this.props.style);

    const innerStyle = objectAssign({}, styles.inner, {
      width: this.props.width || 980,
    });

    return (
      <div style={rootStyle}>
        <div style={innerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Wrapper;
