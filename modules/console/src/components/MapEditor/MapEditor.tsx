import * as React from 'react';
import { findDOMNode } from 'react-dom';
import DesignManager from '../../DesignManager';
import MapCanvas from './MapCanvas';

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};

export interface MapEditorState {
  fileId: string;
}

interface MapEditorProps {
  editorState: MapEditorState;
  onChange: (fileId: string, editorState: MapEditorState) => void;
  designManager: DesignManager;
  sizeRevision: number;
}

class MapEditor extends React.Component<MapEditorProps, void> {
  static createState: (fileId: string) => MapEditorState;

  canvas: MapCanvas;

  componentDidMount() {
    this.canvas = new MapCanvas(
      findDOMNode<HTMLElement>(this.refs['canvas']),
      this.props.designManager
    );
  }

  componentWillReceiveProps(nextProps: MapEditorProps) {
    if (nextProps.sizeRevision !== this.props.sizeRevision) {
      this.canvas.resize();
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div style={styles.root} ref="canvas"></div>;
  }
}

MapEditor.createState = (fileId: string): MapEditorState => {
  return {
    fileId,
  };
}

export default MapEditor;
