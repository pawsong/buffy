import React from 'react';
import Immutable from 'immutable';
import waitForMount from '../../../../../components/waitForMount';

import GeometryFactory from '../../../../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../../../../canvas/TroveGeometryFactory';
import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
  ToolType,
  ToolFilter,
  PanelFilter,
} from '../../../../../components/ModelEditor';
import { Action } from '../../../../../components/ModelEditor/types';
import { pushSnackbar } from '../../../../../actions/snackbar';

import { DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');

interface EditorContainerProps {
  onAction: (action: Action<any>) => Action<any>;
  toolFilter: ToolFilter;
  panelFilter: PanelFilter;
  commonState: ModelCommonState;
  onCommonStateChange: (commonState: ModelCommonState) => any;
  fileState: ModelFileState;
  onFileStateChange: (fileState: ModelFileState) => any;
}

@waitForMount
@(DragDropContext(HTML5Backend) as any)
class EditorContainer extends React.Component<EditorContainerProps, void> {
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;
  extraState: ModelExtraData;

  constructor(props: EditorContainerProps) {
    super(props);
    this.geometryFactory = new GeometryFactory();
    this.troveGeometryFactory = new TroveGeometryFactory();

    this.extraState = ModelEditor.createExtraData(this.props.fileState.present.data.size);
  }

  render() {
    return (
      <ModelEditor
        dispatchActionPreHook={this.props.onAction}
        toolFilter={this.props.toolFilter}
        panelFilter={this.props.panelFilter}
        commonState={this.props.commonState}
        onCommonStateChange={this.props.onCommonStateChange}
        fileState={this.props.fileState}
        onFileStateChange={this.props.onFileStateChange}
        extraData={this.extraState}
        geometryFactory={this.geometryFactory}
        troveGeometryFactory={this.troveGeometryFactory}
        sizeVersion={0}
        useSidebar={false}
        useContextMenu={false}
      />
    );
  }
}

export default EditorContainer;
