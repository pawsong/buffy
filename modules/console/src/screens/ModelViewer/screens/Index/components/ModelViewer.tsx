import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as ndarray from 'ndarray';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import * as classNames from 'classnames';

import ModelCanvas from '../../../../../canvas/ModelCanvas';
import { FileState } from '../../../../../components/ModelEditor/types';

const styles = require('./ModelViewer.css');

const rootClass = [
  'row',
  styles.root,
].join(' ');

const inlineStyles = {
  root: {
    width: 100,
    height: 100,
  },
}

interface ModelViewerProps {
  fileState: FileState;
}

@withStyles(styles)
class ModelViewer extends React.Component<ModelViewerProps, {}> {
  canvas: ModelCanvas;

  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['root']);

    this.canvas = new ModelCanvas(container, this.props.fileState);
    this.canvas.init();
  }

  componentWillUnmount() {
    this.canvas.destroy();
    // TODO: Destroy geometryFactory
  }

  render() {
    return (
      <div className={rootClass}>
        <div className={styles.wrapper}>
          <div className={styles.main} ref="root"></div>
        </div>
      </div>
    );
  }
}

export default ModelViewer;
