import React from 'react';
import {findDOMNode} from 'react-dom';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

const styles = require('./ProgressBar.css');

export enum ProgressState {
  STOPPED,
  PLAYING,
  PAUSED,
}

interface ProgressBarProps {
  className?: string;
  state: ProgressState;
  repeat: boolean;
  maxValue: number;
}

@withStyles(styles)
class ProgressBar extends React.Component<ProgressBarProps, {}> {
  element: HTMLElement;
  time: HTMLElement;
  frameId: number;
  value: number;
  then: number;

  constructor(props) {
    super(props);
    this.value = 0;
  }

  componentDidMount() {
    this.element = findDOMNode<HTMLElement>(this.refs['bar']);
    this.time = findDOMNode<HTMLElement>(this.refs['time']);
    this.updateUi();
  }

  componentWillReceiveProps(nextProps: ProgressBarProps) {
    if (this.props.state !== nextProps.state) {
      switch(nextProps.state) {
        case ProgressState.STOPPED: {
          this.value = 0;
          cancelAnimationFrame(this.frameId);
          this.updateUi();
          break;
        }
        case ProgressState.PLAYING: {
          this.then = Date.now();
          this.animate();
          break;
        }
        case ProgressState.PAUSED: {
          cancelAnimationFrame(this.frameId);
          break;
        }
      }
    }
  }

  componentDidUpdate(prevProps: ProgressBarProps) {
    if (prevProps.maxValue !== this.props.maxValue) this.updateUi();
  }

  animate = () => {
    const now = Date.now();
    this.value += now - this.then;
    this.then = now;

    if (this.value >= this.props.maxValue) {
      if (this.props.repeat) {
        this.value = 0;
        this.frameId = requestAnimationFrame(this.animate);
      } else {
        this.value = this.props.maxValue;
      }
    } else {
      this.frameId = requestAnimationFrame(this.animate);
    }

    this.updateUi();
  }

  updateUi() {
    this.element.style.width = `${this.value / this.props.maxValue * 100}%`;

    const remainSecs = (this.props.maxValue - this.value) / 1000;
    this.time.innerText = remainSecs.toFixed(0);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
  }

  render() {
    return (
      <div className={`${styles.root} ${this.props.className || ''}`}>
        <div className={styles.barCont}><div ref="bar" className={styles.bar} /></div>
        <div className={styles.time}><span ref="time" /><span> s</span></div>
      </div>
    );
  }
}

export default ProgressBar;
