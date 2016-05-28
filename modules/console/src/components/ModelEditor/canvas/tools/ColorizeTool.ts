import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

import {
  changePaletteColor,
} from '../../actions';

import {
  ToolType,
  GetEditorState,
  DispatchAction,
} from '../../types';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

const COLOR_TOOLTIP_RADIUS = 20;

function multiplyColor({ r, g, b }) {
  return {
    r: 0xff * r,
    g: 0xff * g,
    b: 0xff * b,
  };
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: ColorizeTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();
    this.cursor = new Cursor(canvas, {
      visible: false,
      getInteractables: () => [canvas.component.modelMesh],
      onInteract: params => this.handleInteract(params),
      onMiss: params => this.handleMiss(params),
      onTouchTap: params => this.handleTouchTap(params),
    });
  }

  onEnter() {
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.tool.hideTooltip();
  }

  handleMiss({ event, intersect }: CursorEventParams) {
    this.tool.hideTooltip();
  }

  handleInteract({ event, intersect }: CursorEventParams) {
    const { face } = intersect;
    this.tool.showTooltip(event.offsetX, event.offsetY, multiplyColor(face.color));
  }

  handleTouchTap({ event, intersect }: CursorEventParams) {
    if (!intersect) return;

    const { face } = intersect;
    this.dispatchAction(changePaletteColor(multiplyColor(face.color)));
  }
}

class ColorizeTool extends ModelEditorTool<void, void, void> {
  colorTooltip: HTMLElement;

  getToolType(): ToolType { return ToolType.colorize; }

  init(params: InitParams) {
    params.dispatchAction;

    this.colorTooltip = document.createElement("div");
    this.colorTooltip.style.position = 'absolute';
    this.colorTooltip.style.display = 'none';
    this.colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    this.colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    params.canvas.container.appendChild(this.colorTooltip);

    const wait = new WaitState(this, params.canvas, params.dispatchAction);

    return {
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
