function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

interface Color {
  r: number;
  g: number;
  b: number;
}

export default function rgbToHex(color: Color) {
  return `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;
}
