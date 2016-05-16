import VoxelEditorTool, {
  InitParams,
  VoxelEditorToolState,
  VoxelEditorToolStates,
  InteractParams,
  MouseUpParams,
} from './VoxelEditorTool';

import View from '../views/main';
import { SetState } from '../types';

import {
  ToolType,
  GetEditorState,
  DispatchAction,
} from '../../types';

const COLOR_TOOLTIP_RADIUS = 20;

function multiplyColor({ r, g, b }) {
  return {
    r: 0xff * r,
    g: 0xff * g,
    b: 0xff * b,
  };
}

interface WaitStateProps {

}

class WaitState extends VoxelEditorToolState<WaitStateProps> {
  constructor(
    private tool: ColorPickerTool,
    private setEditorState: SetState
  ) {
    super();
  }

  render() {}

  isIntersectable(object) {
    return object.isVoxel;
  }

  onInteract({ intersect, event }: InteractParams) {
    this.tool.hideTooltip();

    if (!intersect) return;
    if (!intersect.object['isVoxel']) return;

    const { face } = intersect;
    this.tool.showTooltip(event.offsetX, event.offsetY, multiplyColor(face.color));
  }

  onMouseUp({ intersect }: MouseUpParams) {
    if (!intersect) return;
    if (!intersect.object['isVoxel']) return;

    const { face } = intersect;
    this.setEditorState({ paletteColor: multiplyColor(face.color) });
  }

  onLeave() {
    this.tool.hideTooltip();
  }
}

class ColorPickerTool extends VoxelEditorTool {
  colorTooltip: HTMLElement;

  getToolType(): ToolType { return ToolType.colorize; }

  init(params: InitParams) {
    this.colorTooltip = document.createElement("div");
    this.colorTooltip.style.position = 'absolute';
    this.colorTooltip.style.display = 'none';
    this.colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    params.view.container.appendChild(this.colorTooltip);

    const wait = new WaitState(this, params.setState);

    return <VoxelEditorToolStates>{
      wait,
    };
  }

  hideTooltip() {
    this.colorTooltip.style.display = `none`;
  }

  showTooltip(x, y, c) {
    this.colorTooltip.style.display = `block`;
    const left = x - COLOR_TOOLTIP_RADIUS;
    const top = y - 2 * COLOR_TOOLTIP_RADIUS - 30;
    this.colorTooltip.style.left = `${left}px`;
    this.colorTooltip.style.top = `${top}px`;
    this.colorTooltip.style.background = `rgb(${c.r},${c.g},${c.b})`;
  }

  destroy() {
    this.colorTooltip.remove();
  }
}

export default ColorPickerTool;
