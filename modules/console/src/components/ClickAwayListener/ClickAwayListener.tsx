import * as React from 'react';
import * as ReactDOM from 'react-dom';
import events from 'material-ui/lib/utils/events';

const isDescendant = (el, target) => {
  if (target !== null) {
    return el === target || isDescendant(el, target.parentNode);
  }
  return false;
};

const clickAwayEvents = ['mousedown', 'touchstart'];
const bind = (callback) => clickAwayEvents.forEach((event) => events.on(document as any, event, callback));
const unbind = (callback) => clickAwayEvents.forEach((event) => events.off(document as any, event, callback));

interface ClickAwayListenerProps extends React.Props<ClickAwayListener> {
  onClickAway: (event: Event) => any;
  style?: React.CSSProperties;
}

export default class ClickAwayListener extends React.Component<ClickAwayListenerProps, {}> {

  static propTypes = {
    children: React.PropTypes.node,
    onClickAway: React.PropTypes.any,
  };

  componentDidMount() {
    if (this.props.onClickAway) {
      bind(this.handleClickAway);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.onClickAway !== this.props.onClickAway) {
      unbind(this.handleClickAway);
      if (this.props.onClickAway) {
        bind(this.handleClickAway);
      }
    }
  }

  componentWillUnmount() {
    unbind(this.handleClickAway);
  }

  handleClickAway = (event) => {
    const el = ReactDOM.findDOMNode(this);

    if (document.documentElement.contains(event.target) && !isDescendant(el, event.target)) {
      this.props.onClickAway(event);
    }
  };

  render() {
    return <div style={this.props.style || {}}>{this.props.children}</div>;
  }
}
