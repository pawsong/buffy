import React from 'react';
import { Link } from 'react-router';
// import FlatButton from 'material-ui/FlatButton';
const FlatButton = require('material-ui/FlatButton').default;
import { cyan500, cyan200, fullWhite } from 'material-ui/styles/colors';

interface DualButtonProps {
  className?: string;
  icon: React.ReactElement<any>;
  leftLabel: string;
  leftHref?: string;
  leftOnTouchTap?: () => any;
  rightLabel: string;
  rightHref?: string;
  rightOnTouchTap?: () => any;
}

const DualButton: React.StatelessComponent<DualButtonProps> = (props) => {
  const icon = React.cloneElement(props.icon, {
    color: fullWhite,
    style: { width: 18, height: 18 },
  });

  return (
    <div className={props.className} style={{ display: 'inline-block' }}>
      <FlatButton
        backgroundColor={cyan500}
        hoverColor={cyan200}
        style={{
          minWidth: 0,
          color: fullWhite,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
        labelStyle={{ paddingLeft: 12, paddingRight: 12 }}
        label={props.leftLabel}
        icon={icon}
        onTouchTap={props.leftOnTouchTap}
        containerElement={props.leftHref && <Link to={props.leftHref} /> || <a />}
      />
      <FlatButton
        backgroundColor={cyan500}
        hoverColor={cyan200}
        style={{
          minWidth: 0,
          color: fullWhite,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        labelStyle={{ paddingLeft: 12, paddingRight: 12 }}
        label={props.rightLabel}
        onTouchTap={props.rightOnTouchTap}
        containerElement={props.rightHref && <Link to={props.rightHref} /> || <a />}
      />
    </div>
  );
};

export default DualButton;
