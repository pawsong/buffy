import * as React from 'react';
import Colors from 'material-ui/lib/styles/colors';
const Radium = require('radium');
const objectAssign = require('object-assign');

const styles = {
  tab: {
    flex: 1,
    borderLeft: '1px solid',
    borderColor: Colors.grey400,
    borderRadius: 0,
    position: 'relative',
    top: 0,
    maxWidth: '22em',
    minWidth: '7em',
    height: '100%',
    padding: 0,
    margin: 0,
    backgroundClip: 'content-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTitle: {
    textAlign: 'center',
    margin: 0,
    borderBottom: '1px solid transparent',
    textOverflow: 'clip',
    userSelect: 'none',
    cursor: 'default',
  },
};

export interface TabProps extends React.Props<Tab> {
  value: any;
  label: string;
  active?: boolean;
  onClick?: () => any;
  style?: React.CSSProperties;
}

@Radium
class Tab extends React.Component<TabProps, {}> {
  render() {
    const style = objectAssign({}, styles.tab, {
      color: this.props.active ? '#282929' : '#939395',
      backgroundColor: this.props.active ? Colors.white : '#e5e5e6',
    }, this.props.style);

    return (
      <li
        style={style}
        onClick={this.props.onClick}
      >
        <div
          style={styles.tabTitle}
        >
          {this.props.label}
        </div>
      </li>
    );
  }
}

export default Tab;
