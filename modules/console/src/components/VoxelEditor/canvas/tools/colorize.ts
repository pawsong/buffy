import {
  Services,
  GetEditorState,
  ObserveEditorState,
} from '../../interface';

import highlightVoxel from './highlightVoxel';

const COLOR_TOOLTIP_RADIUS = 20;

function multiplyColor({ r, g, b }) {
  return {
    r: 0xff * r,
    g: 0xff * g,
    b: 0xff * b,
  };
}

export default [
  ({
    handleEditorStateChange,
    container,
  }: Services) => {

    const colorTooltip = document.createElement("div");
    colorTooltip.style.position = 'absolute';
    colorTooltip.style.display = 'none';
    colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
    colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
    container.appendChild(colorTooltip);

    function hideTooltip() {
      colorTooltip.style.display = `none`;
    }

    function showTooltip(x, y, c) {
      colorTooltip.style.display = `block`;
      const left = x - COLOR_TOOLTIP_RADIUS;
      const top = y - 2 * COLOR_TOOLTIP_RADIUS - 30;
      colorTooltip.style.left = `${left}px`;
      colorTooltip.style.top = `${top}px`;
      colorTooltip.style.background = `rgb(${c.r},${c.g},${c.b})`;
    }

    return {
      onInteract({
        intersect,
        event,
      }) {
        hideTooltip();
        if (!intersect) { return; }
        if (!intersect.object.isVoxel) { return; }
        const { face } = intersect;
        showTooltip(event.offsetX, event.offsetY, multiplyColor(face.color));
      },

      onMouseUp({
        intersect,
      }) {
        if (!intersect) { return; }
        if (!intersect.object.isVoxel) { return; }

        const { face } = intersect;
        handleEditorStateChange({ paletteColor: multiplyColor(face.color) });
      },

      onLeave() {
        hideTooltip();
      },
    };
  },
]
