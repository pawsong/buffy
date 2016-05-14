import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';

import {
  EditToolType,
  WorldEditorState,
} from '../../../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';

import WorldEditorCanvasTool, {
  WorldEditorCanvsToolState,
  WorldEditorCanvsToolStates,
} from '../../WorldEditorCanvasTool';
import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';

import { CursorEventParams } from '../../../CursorManager';

const COLOR_TOOLTIP_RADIUS = 20;

function multiplyColor({ r, g, b }) {
  return {
    r: 0xff * r,
    g: 0xff * g,
    b: 0xff * b,
  };
}

interface WaitStateProps {}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  constructor(
    private tool: ColorizeTool,
    private view: WorldEditorCanvas
  ) {
    super();
  }

  onEnter() {
    this.view.cursorManager.start({
      onInteract: (params) => this.handleInteract(params),
      onTouchTap: (params) => this.handleTouchTap(params),
    });
  }

  onLeave() {
    this.view.cursorManager.stop();
    this.tool.hideTooltip();
  }

  handleInteract({ event, intersect }: CursorEventParams) {
    this.tool.hideTooltip();

    if (!intersect) return;

    const { face } = intersect;
    this.tool.showTooltip(event.offsetX, event.offsetY, multiplyColor(face.color));
  }

  handleTouchTap({ event, intersect }: CursorEventParams) {
    if (!intersect) return;

    const { face } = intersect;
    this.tool.setEditorState({
      brushColor: multiplyColor(face.color),
    });
  }

  render() {}
}

class ColorizeTool extends EditModeTool {
  colorTooltip: HTMLElement;
  setEditorState: (editorState: WorldEditorState) => any;

  getToolType() { return EditToolType.colorize; }

  init({ view, setEditorState }: InitParams) {
    this.setEditorState = setEditorState;

    this.colorTooltip = document.createElement("div");
    this.colorTooltip.style.position = 'absolute';
    this.colorTooltip.style.display = 'none';
    this.colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    view.container.appendChild(this.colorTooltip);

    const wait = new WaitState(this, view);

    return <WorldEditorCanvsToolStates>{
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

export default ColorizeTool;
