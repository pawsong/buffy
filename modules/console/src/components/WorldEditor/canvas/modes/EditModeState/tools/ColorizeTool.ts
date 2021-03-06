import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';

import {
  EditToolType,
  WorldEditorState,
  DispatchAction,
} from '../../../../types';

import {
  changePaletteColor,
} from '../../../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';
import Cursor, { CursorEventParams } from '../../../../../../canvas/Cursor';

import EditModeTool, {
  InitParams,
  ToolState, ToolStates,
} from './EditModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

const COLOR_TOOLTIP_RADIUS = 20;

function multiplyColor({ r, g, b }) {
  return {
    r: 0xff * r,
    g: 0xff * g,
    b: 0xff * b,
  };
}

interface WaitStateProps {}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: ColorizeTool) {
    super();
    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => tool.canvas.objectManager.object3Ds.concat(tool.canvas.chunk.mesh),
      onHit: (params) => this.handleHit(params),
      onMiss: () => this.tool.hideTooltip(),
      onTouchTap: (params) => this.handleTouchTap(params),
    });
  }

  onEnter() {
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
  }

  handleHit({ event, intersect }: CursorEventParams) {
    const { face } = intersect;
    this.tool.showTooltip(event.offsetX, event.offsetY, multiplyColor(face.color));
  }

  handleTouchTap({ event, intersect }: CursorEventParams) {
    if (!intersect) return;

    const { face } = intersect;
    this.tool.dispatchAction(changePaletteColor(multiplyColor(face.color)));
  }
}

class ColorizeTool extends EditModeTool<any, void, void> {
  colorTooltip: HTMLElement;
  dispatchAction: DispatchAction;

  getToolType() { return EditToolType.COLORIZE; }

  onInit(params: InitParams) {
    super.onInit(params);

    this.colorTooltip = document.createElement("div");
    this.colorTooltip.style.position = 'absolute';
    this.colorTooltip.style.display = 'none';
    this.colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.canvas.container.appendChild(this.colorTooltip);
  }

  createStates(): ToolStates {
    return {
      wait: new WaitState(this),
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

  onStop() {
    super.onStop();
    this.hideTooltip();
  }

  onDestroy() {
    this.colorTooltip.remove();
  }
}

export default ColorizeTool;
