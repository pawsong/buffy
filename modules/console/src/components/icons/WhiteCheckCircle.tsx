import * as React from 'react';
const pure = require('recompose/pure').default;
import SvgIcon from 'material-ui/SvgIcon';

interface SvgIconProps extends React.SVGAttributes, React.Props<SvgIcon> {
    // <svg/> is the element that get the 'other' properties
    color?: string;
    hoverColor?: string;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    style?: React.CSSProperties;
    viewBox?: string;
}

@pure
class WhiteCheckCircle extends React.Component<SvgIconProps, {}> {
  render() {
    return (
      <SvgIcon {...this.props} viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" style={{fill: 'none'}}/>
        <path d="M 12 2 C 17.52 2 22 6.48 22 12 C 22 17.52 17.52 22 12 22 C 6.48 22 2 17.52 2 12 C 2 6.48 6.48 2 12 2 Z"/>
        <path d="M 10 17 L 19 8 L 17.59 6.58 L 10 14.17 L 6.41 10.59 L 5 12 L 10 17 Z" style={{fill: 'rgb(255, 255, 255)'}}/>
      </SvgIcon>
    );
  }
}

export default WhiteCheckCircle;
