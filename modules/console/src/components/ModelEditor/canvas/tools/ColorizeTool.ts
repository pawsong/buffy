import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  changePaletteColor,
} from '../../actions';

import {
  ToolType,
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

const STATE_WAIT = ToolState.STATE_WAIT;

class ColorizeTool extends ModelEditorTool<void, void, void> {
  colorTooltip: HTMLElement;

  getToolType(): ToolType { return ToolType.COLORIZE; }

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
      [STATE_WAIT]: new WaitState(this),
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

  onDestroy() {
    this.colorTooltip.remove();
  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: ColorizeTool) {
    super();
    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => [tool.canvas.component.modelMesh],
      onHit: params => this.handleHit(params),
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

export default ColorizeTool;
