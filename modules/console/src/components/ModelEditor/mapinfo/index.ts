import { MaterialMapType } from '../../../types';

function componentToHex(c: number) {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
}

function hexString(r: number, g: number, b: number) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hex(r: number, g: number, b: number) {
  return (r << 16) | (g << 8) | b;
}

interface MapInfoParams {
  colors: [number, number, number][];
}

class MapInfo {
  defaultColor: number;
  colors: number[];
  hexColors: string[];

  constructor(params: MapInfoParams) {
    this.colors = params.colors.map(c => hex(c[0], c[1], c[2]));
    this.defaultColor = this.colors[0];
    this.hexColors = params.colors.map(c => hexString(c[0], c[1], c[2]));
  }
}

const infos: { [index: string]: MapInfo } = {
  [MaterialMapType.TROVE_TYPE]: new MapInfo({
    colors: [
      [255, 255, 255],
      [128, 128, 128],
      [64 , 64 , 64 ],
      [255, 0  , 0  ],
      [255, 255, 0  ],
    ],
  }),
  [MaterialMapType.TROVE_ALPHA]: new MapInfo({
    colors: [
      [16,  16 , 16 ],
      [48,  48 , 48 ],
      [80 , 80 , 80 ],
      [112, 112, 112],
      [144, 144, 144],
      [176, 176, 176],
      [208, 208, 208],
      [240, 240, 240],
    ],
  }),
  [MaterialMapType.TROVE_SPECULAR]: new MapInfo({
    colors: [
      [128, 0  , 0  ],
      [0  , 128, 0  ],
      [0  , 0  , 128],
      [128, 128, 0  ],
      [128, 0  , 128],
    ],
  }),
};

export default infos;
