import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import CheckBoxOutlineBlank from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import {cyan500} from 'material-ui/styles/colors';

const styles = require('./InstructionList.css');

interface InstructionListProps {
}

const done = <CheckBox className={styles.taskIcon} color={cyan500} />;
const pending = <CheckBoxOutlineBlank className={styles.taskIcon} />;

@withStyles(styles)
class InstructionList extends React.Component<InstructionListProps, void> {
  render() {
    return (
      <div>
        <div className={styles.header}>Instructions</div>
        <ul className={styles.tasks}>{this.props.children}</ul>
      </div>
    );
  }
}

export default InstructionList;

interface InstructionItemProps {
  done: boolean;
}

class InstructionItem extends React.Component<InstructionItemProps, void> {
  render() {
    return (
      <li className={styles.task}>
        {this.props.done ? done : pending}
        <span className={styles.taskLabel}>{this.props.children}</span>
      </li>
    );
  }
}

export { InstructionItem };
