import * as React from 'react';
const Radium = require('radium');

const styles = {
  layout: {
    display: 'flex',
  },
  container: {
    position: 'relative',
    flex: 1,
  },
  divider: {
    width: '100%',
    opacity: .2,
    zIndex: 1,
    boxSizing: 'border-box',
    backgroundColor: '#000',
    backgroundClip: 'padding-box',
  },
  dividerHorizontal: {
    height: '11px',
    margin: '-5px 0',
    borderTop: '5px solid rgba(255, 255, 255, 0)',
    borderBottom: '5px solid rgba(255, 255, 255, 0)',
    cursor: 'row-resize',
    width: '100%',
    ':hover': {
      borderTop: '5px solid rgba(0, 0, 0, 0.5)',
      borderBottom: '5px solid rgba(0, 0, 0, 0.5)',
    },
  },
  dividerVertical: {
    width: '11px',
    margin: '0 -5px',
    borderLeft: '5px solid rgba(255, 255, 255, 0)',
    borderRight: '5px solid rgba(255, 255, 255, 0)',
    cursor: 'col-resize',
    height: '100%',
    ':hover': {
      borderLeft: '5px solid rgba(0, 0, 0, 0.5)',
      borderRight: '5px solid rgba(0, 0, 0, 0.5)',
    },
  },
};

function isElementOfType(inst, convenienceConstructor) {
  return (
    React.isValidElement(inst) &&
    inst.type === convenienceConstructor
  );
}

/*
 * Layout
 */

export interface LayoutProps extends React.Props<Layout> {
  flow: string; // row | column
  style?: Object;
}

export interface LayoutStates {
  [index: string]: number;
}

@Radium
export class Layout extends React.Component<LayoutProps, LayoutStates> {
  static propTypes = {
    flow: React.PropTypes.string.isRequired,
  }

  state = {} as LayoutStates;

  remainingIndex: number = -1;
  sizeProp: string;

  handleDividerDrag = (index: number, size: number) => {
    this.setState({ [`size_${index}`]: size });
  }

  componentWillMount() {
    switch(this.props.flow) {
      case 'row':
        this.sizeProp = 'width';
        break;
      case 'column':
        this.sizeProp = 'height';
        break;
      default:
        throw new Error(`Invalid flow '${this.props.flow}'`);
    }

    const state = {} as LayoutStates;
    React.Children.forEach(this.props.children, (child, index) => {
      if (!isElementOfType(child, LayoutContainer)) {
        throw new Error('Layout child must be LayoutContainer');
      }
      const { size, remaining } = (child as React.ReactElement<LayoutContainerProps>).props;
      if (remaining) {
        if (this.remainingIndex !== -1) {
          throw new Error('Only one LayoutContainer can set remaining to true');
        }
        this.remainingIndex = index;
      } else {
        if (typeof size === undefined) {
          throw new Error(`LayoutContainer must have props 'remaining' or 'size'`);
        }
        state[`size_${index}`] = size;
      }
    });

    if (this.remainingIndex === -1) {
      throw new Error('At least one LayoutContainer must set remaining to true');
    }
    this.setState(state);
  }

  render() {
    const children = React.Children.toArray(this.props.children) as
                     React.ReactElement<LayoutContainerProps>[];

    const result = [];
    const len = children.length;

    const remainingChild = children[this.remainingIndex];

    for (let i = 0; i < this.remainingIndex; ++i) {
      const child = children[i];
      if (child.props.hide) continue;

      const size = this.state[`size_${i}`];

      // Container
      result.push(
        <div
          key={`c${i}`}
          style={{
            display: 'flex',
            [this.sizeProp]: size,
          }}
        >
          {child}
        </div>
      );

      const onDrag = (params: DragParams) => {
        const size = Math.max(params.size + params.delta, 0);
        this.handleDividerDrag(params.index, size);
        remainingChild.props.onResize && remainingChild.props.onResize();
        child.props.onResize && child.props.onResize(size);
      };

      // Divider
      result.push(
        <LayoutDivider
          flow={this.props.flow}
          key={`d${i}`}
          index={i}
          size={size}
          onDrag={onDrag}
        />
      );
    }

    result.push(
      <div
        key={`c${this.remainingIndex}`}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'auto',
        }}
      >
        {remainingChild}
      </div>
    );

    for (let i = this.remainingIndex + 1; i < len; ++i) {
      const child = children[i];
      if (child.props.hide) continue;

      const size = this.state[`size_${i}`];

      const onDrag = (params: DragParams) => {
        const size = Math.max(params.size - params.delta, 0);
        this.handleDividerDrag(params.index, size);
        remainingChild.props.onResize && remainingChild.props.onResize();
        child.props.onResize && child.props.onResize(size);
      };

      // Divider
      result.push(
        <LayoutDivider
          flow={this.props.flow}
          key={`d${i}`}
          index={i}
          size={size}
          onDrag={onDrag}
        />
      );

      // Container
      result.push(
        <div
          key={`c${i}`}
          style={{
            display: 'flex',
            [this.sizeProp]: size,
          }}
        >
          {child}
        </div>
      );
    }

    return (
      <div
        style={[
          styles.layout,
          { flexFlow: this.props.flow },
          this.props.style || {},
        ]}
      >
        {result}
      </div>
    );
  };
}

/*
 * LayoutContainer
 */

export interface LayoutContainerProps extends React.Props<LayoutContainer> {
  remaining?: boolean;
  size?: number;
  onResize?: (size?: number) => any;
  hide?: boolean;
}

export class LayoutContainer extends React.Component<LayoutContainerProps, {}> {
  static propTypes = {
    remaining: React.PropTypes.bool,
    size: React.PropTypes.number,
  }

  render() {
    return <div style={styles.container}>{this.props.children}</div>;
  };
}

/*
 * LayoutDivider
 */

interface DragParams {
  index: number;
  size: number;
  delta: number;
}

interface LayoutDividerProps extends React.Props<LayoutDivider> {
  flow: string;
  onDrag: (params: DragParams) => any;
  index: number;
  size: number;
}

@Radium
class LayoutDivider extends React.Component<LayoutDividerProps, {}> {
  static propTypes = {
    onDrag: React.PropTypes.func.isRequired,
    index: React.PropTypes.number.isRequired,
    size: React.PropTypes.number.isRequired,
  }

  handleMouseUp: any;
  handleMouseMove: any;

  getPosition = {
    row: (e) => e.clientX,
    column: (e) => e.clientY,
  }

  style = {
    row: styles.dividerVertical,
    column: styles.dividerHorizontal,
  }

  componentWillUnmount() {
    this.stoplistening();
  }

  stoplistening() {
    if (this.handleMouseUp) {
      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('touchend', this.handleMouseUp);
      document.removeEventListener('dragend', this.handleMouseUp);
      this.handleMouseUp = undefined;
    }
    if (this.handleMouseMove) {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('touchmove', this.handleMouseMove);
      this.handleMouseMove = undefined;
    }
  }

  handleMouseDown(event) {
    this.stoplistening();

    // Size snapshot
    const { size } = this.props;
    const origin = this.getPosition[this.props.flow](event);

    this.handleMouseMove = e => this.props.onDrag({
      index: this.props.index,
      size,
      delta: this.getPosition[this.props.flow](e) - origin,
    });
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('touchmove', this.handleMouseMove);

    this.handleMouseUp = e => this.stoplistening();
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchend', this.handleMouseUp);
    document.addEventListener('dragend', this.handleMouseUp);
  }

  render() {
    return <div style={[styles.divider, this.style[this.props.flow]]}
                onMouseDown={this.handleMouseDown.bind(this)}
                onTouchStart={this.handleMouseDown.bind(this)}></div>;
  }
}
