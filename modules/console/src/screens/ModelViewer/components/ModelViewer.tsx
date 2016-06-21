import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as ndarray from 'ndarray';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import * as classNames from 'classnames';

import GeometryFactory from '../../../canvas/GeometryFactory';
import ModelViewerCanvas from '../canvas/ModelViewerCanvas';

const styles = require('./ModelViewer.css');

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
  styles.wrapper,
].join(' ');

const inlineStyles = {
  root: {
    width: 100,
    height: 100,
  },
}

interface ModelViewerProps {
  data: ndarray.Ndarray;
}

@withStyles(styles)
class ModelViewer extends React.Component<ModelViewerProps, {}> {
  geometryFactory: GeometryFactory;
  canvas: ModelViewerCanvas;

  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['root']);

    this.geometryFactory = new GeometryFactory();
    const geometry = this.geometryFactory.getGeometry(this.props.data);

    this.canvas = new ModelViewerCanvas(container, geometry);
    this.canvas.init();
  }

  componentWillUnmount() {
    this.canvas.destroy();
    // TODO: Destroy geometryFactory
  }

  render() {
    return (
      <div className="row">
        <div className={styles.wrapper}>
          <div className={styles.main} ref="root"></div>
        </div>
      </div>
    );
  }
}

export default ModelViewer;
