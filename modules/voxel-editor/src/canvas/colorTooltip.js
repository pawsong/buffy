const COLOR_TOOLTIP_RADIUS = 20;

export function createColorTooltip(container) {
  const colorTooltip = document.createElement("div");
  colorTooltip.style.position = 'absolute';
  colorTooltip.style.display = 'none';
  colorTooltip.style.width = `${2 * COLOR_TOOLTIP_RADIUS}px`;
  colorTooltip.style.height = `${2 * COLOR_TOOLTIP_RADIUS}px`;
  colorTooltip.style['border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
  colorTooltip.style['-moz-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
  colorTooltip.style['-webkit-border-radius'] = `${COLOR_TOOLTIP_RADIUS}px`;
  container.appendChild(colorTooltip);

  function hide() {
    colorTooltip.style.display = `none`;
  }

  function show(x, y, c) {
    colorTooltip.style.display = `block`;
    const left = x - COLOR_TOOLTIP_RADIUS;
    const top = y - 2 * COLOR_TOOLTIP_RADIUS - 30;
    colorTooltip.style.left = `${left}px`;
    colorTooltip.style.top = `${top}px`;
    colorTooltip.style.background = `rgba(${c.r},${c.g},${c.b},${c.a})`;
  }

  return {
    hide,
    show
  };
};
