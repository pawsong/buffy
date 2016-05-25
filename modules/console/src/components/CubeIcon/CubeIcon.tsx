import * as React from 'react';
const pure = require('recompose/pure').default;
import SvgIcon from 'material-ui/lib/svg-icon';

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
class CubeIcon extends React.Component<SvgIconProps, {}> {
  render() {
    return (
      <SvgIcon {...this.props} viewBox="0 0 24 24">
        <path fill="#000000" fill-opacity="1" stroke-width="0.2" stroke-linejoin="round" d="M 21,16.5C 21,16.8812 20.7867,17.2125 20.473,17.3813L 12.5664,21.8243C 12.4054,21.9351 12.2103,22 12,22C 11.7897,22 11.5946,21.9351 11.4336,21.8243L 3.52716,17.3814C 3.21335,17.2127 3,16.8812 3,16.5L 3,7.5C 3,7.11876 3.21334,6.78735 3.52716,6.61864L 11.4336,2.17575C 11.5946,2.0649 11.7897,2.00001 12,2.00001C 12.2103,2.00001 12.4053,2.06489 12.5664,2.17574L 20.473,6.61872C 20.7867,6.78746 21,7.11883 21,7.5L 21,16.5 Z M 12.0009,4.15093L 6.04124,7.5L 12.0009,10.8491L 17.9591,7.5L 12.0009,4.15093 Z M 5,15.9149L 11,19.2866L 11,12.5806L 5,9.209L 5,15.9149 Z M 19,15.9149L 19,9.20901L 13,12.5806L 13,19.2875L 19,15.9149 Z "/>
      </SvgIcon>
    );
  }
}

export default CubeIcon;
