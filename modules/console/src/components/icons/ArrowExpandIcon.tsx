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
class ArrowExpandIcon extends React.Component<SvgIconProps, {}> {
  render() {
    return (
      <SvgIcon {...this.props} viewBox="0 0 24 24">
        <path d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" />
      </SvgIcon>
    );
  }
}

export default ArrowExpandIcon;
