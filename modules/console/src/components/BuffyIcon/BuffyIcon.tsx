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
class BuffyIcon extends React.Component<SvgIconProps, {}> {
  render() {
    return (
      <SvgIcon {...this.props} viewBox="0 0 142 120">
        <path d="M142 25v95h-20v-20H42v20H22V60H0V30h12V0h70v40h50V25h10zM32 21h-9v19h9V21zm36 0H44v34h24V21z"/>
      </SvgIcon>
    );
  }
}

export default BuffyIcon;
