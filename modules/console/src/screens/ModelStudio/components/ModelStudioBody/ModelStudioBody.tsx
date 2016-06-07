import * as React from 'react';

import waitForMount from '../../../../components/waitForMount';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../../../components/ModelEditor';

import { ModelFile, ModelFileMap } from '../../types';

import FileBrowser from './FileBrowser';
import FileTabs from './FileTabs';

const NAVBAR_HEIGHT = 56;
const TABS_HEIGHT = 33;

const inlineStyles = {
  root: {
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
  editor: {
    position: 'absolute',
    top: TABS_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

interface ModelStudioBodyProps {
  files: ModelFileMap;
  activeFileId: string;
  onFileChange: (body: ModelFileState) => any;
  openedFiles: string[];
  onFileClick: (fileId: string) => any;
  onFileClose: (fileId: string) => any;
  onOpenedFileOrderChange: (dragIndex: number, hoverIndex: number) => any;
}

interface HandlerState {
  editorSizeResivion?: number;
  modelCommonState?: ModelCommonState;
}

const LS_KEY_BROWSER_WIDTH = 'modelstudio.browser.width';

@waitForMount
class ModelStudioBody extends React.Component<ModelStudioBodyProps, HandlerState> {
  private initialBrowserWidth: number;

  constructor(props) {
    super(props);

    const activeFile = this.props.files.get(this.props.activeFileId);

    this.initialBrowserWidth = parseInt(localStorage.getItem(LS_KEY_BROWSER_WIDTH) || 200, 10);

    this.state = {
      editorSizeResivion: 0,
      modelCommonState: ModelEditor.createCommonState(),
    };
  }

  handleCommonStateChange = (modelCommonState: ModelCommonState) => this.setState({ modelCommonState });

  renderEditor() {
    const activeFile = this.props.files.get(this.props.activeFileId);

    if (!activeFile) return null;

    return (
      <div style={inlineStyles.editor}>
        <ModelEditor
          sizeVersion={this.state.editorSizeResivion}
          commonState={this.state.modelCommonState}
          fileState={activeFile.body}
          extraData={activeFile.extra}
          onCommonStateChange={this.handleCommonStateChange}
          onFileStateChange={this.props.onFileChange}
          onApply={() => {
            console.log('onApply');
          }}
        />
      </div>
    );
  }

  resizeEditor = () => this.setState({ editorSizeResivion: this.state.editorSizeResivion + 1 })

  handleBrowserWidthResize = (width: number) => {
    this.resizeEditor();
    localStorage.setItem(LS_KEY_BROWSER_WIDTH, '' + width);
  }

  render() {
    const files = this.props.openedFiles.map(id => this.props.files.get(id));

    return (
      <div style={inlineStyles.root}>
        <FileBrowser
          onFileClick={this.props.onFileClick}
          files={this.props.files}
          initialWidth={this.initialBrowserWidth}
          onToggle={this.resizeEditor}
          onWidthResize={this.handleBrowserWidthResize}
        >
          <FileTabs
            onFileClick={this.props.onFileClick}
            activeFileId={this.props.activeFileId}
            files={files}
            onFileClose={this.props.onFileClose}
            onTabOrderChange={this.props.onOpenedFileOrderChange}
          />
          {this.renderEditor()}
        </FileBrowser>
      </div>
    );
  }
}

export default ModelStudioBody;
