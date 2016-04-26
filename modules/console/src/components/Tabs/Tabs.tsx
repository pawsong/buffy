import * as React from 'react';
import Colors from 'material-ui/lib/styles/colors';
const warning = require('warning');

import Tab, { TabProps } from './Tab';

const styles = {
  tabs: {
    margin: 0,
    display: 'flex',
    position: 'relative',
    height: 33,
    boxShadow: 'inset 0 -1px 0 #d1d1d2',
    background: '#e5e5e6',
    overflowX: 'auto',
    overflowY: 'hidden',
    borderRadius: 0,
    paddingLeft: 0,
    listStyle: 'none',
  },
};

function isElementOfType(inst, convenienceConstructor) {
  return (
    React.isValidElement(inst) &&
    inst.type === convenienceConstructor
  );
}

interface TabsProps extends React.Props<Tabs> {
  activeValue: any;
  onTabClick(value: any): any;
}

class Tabs extends React.Component<TabsProps, {}> {
  getTabs(): React.ReactElement<TabProps>[] {
    const tabs = [];
    React.Children.forEach(this.props.children, (tab) => {
      if (React.isValidElement(tab)) tabs.push(tab);
    });
    return tabs;
  }

  render() {
    const tabs = this.getTabs().map((tab, index) => {
      warning(isElementOfType(tab, Tab), `Tabs only accepts Tab Components as children.`);

      warning(tab.props.value !== undefined,
        `Tabs value prop has been passed, but Tab ${index}
        does not have a value prop. Needs value if Tabs is going
        to be a controlled component.`
      );

      const props: TabProps = {
        key: tab.props.key || index,
        active: tab.props.value === this.props.activeValue,
        value: tab.props.value,
        onClick: () => this.props.onTabClick(tab.props.value),
        label: tab.props.label,
      };

      return React.cloneElement(tab, props);
    });

    return (
      <ul style={styles.tabs}>
        {tabs}
      </ul>
    );
  }
}

export default Tabs;