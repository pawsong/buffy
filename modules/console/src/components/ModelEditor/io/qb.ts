import * as ndarray from 'ndarray';

import {
  ImportResult,
  ExportResult,
} from '../types';

import {
  rgbToHex,
} from '../canvas/utils';

import {
  arrayBufferToString,
} from './utils';

const CODEFLAG = 2;
const NEXTSLICEFLAG = 6;

export function importQbFile(ab: ArrayBuffer): ImportResult {
  const [version, colorFormat, zOrientation, compression, visabilityMask, matrixCount] = new Uint32Array(ab, 0, 6);

  if (version !== 257) {
    return { error: 'Expected version 257 but found version: " + version + " (May result in errors)' };
  }

  // if (visabilityMask !== 0) {
  //   console.warn("partially visability not supported and will be ignored / handled as full visibility");
  // }

  // if (matrixCount > 1) {
  //   console.warn("matrices will be merged into one matrix with regard to their offsets");
  // }

  let dx_offset = 0;
  let dy_offset = 0;
  let dz_offset = 0;

  let maxX = 0;
  let maxY = 0;
  let maxZ = 0;

  let mb = 24;
  for (let i = 1; i <= matrixCount; i += 1) {
    const [nameLen] = new Uint8Array(ab, mb, 1);

    const [x, y, z] = new Uint32Array(ab.slice(mb + 1 + nameLen, mb + 13 + nameLen));
    const [dx, dy, dz] = new Int32Array(ab.slice(mb + 13 + nameLen, mb + 25 + nameLen));

    dx_offset = Math.min(dx_offset, dx);
    dy_offset = Math.min(dy_offset, dy);
    dz_offset = Math.min(dz_offset, dz);

    maxX = Math.max(maxX, x + dx - dx_offset);
    maxY = Math.max(maxY, y + dy - dy_offset);
    maxZ = Math.max(maxZ, z + dz - dz_offset);

    if (compression === 0) {
      mb += 25 + nameLen + 4 * x * y * z;
    } else {
      let ia = 0;
      const data = new Uint8Array(ab.slice(mb + 25 + nameLen));
      for (let iz = 0; iz < z; ++iz) {
        while (true) {
          ia += 4;
          if (data[ia - 4] === 6 && data[ia - 3] === 0 && data[ia - 2] === 0 && data[ia - 1] === 0) {
            break;
          }
          if (data[ia - 4] === 2 && data[ia - 3] === 0 && data[ia - 2] === 0 && data[ia - 1] === 0) {
            ia += 8;
          }
        }
      }
      mb += 25 + nameLen + ia;
    }
  }

  const result = ndarray(new Int32Array(maxX * maxY * maxZ), [maxX, maxY, maxZ]);

  let addValues: (x: number, y: number, z: number, r: number, g: number, b: number) => any;
  if (zOrientation === 0) {
    if (colorFormat === 0) {
      addValues = (x, y, z, r, g, b) => result.set(x, y, z, rgbToHex({ r, g, b }));
    } else {
      addValues = (x, y, z, r, g, b) => result.set(x, y, z, rgbToHex({ r: b, g, b: r }));
    }
  } else {
    if (colorFormat === 0) {
      addValues = (x, y, z, r, g, b) => result.set(x, y, maxZ - z - 1, rgbToHex({ r, g, b }));
    } else {
      addValues = (x, y, z, r, g, b) => result.set(x, y, maxZ - z - 1, rgbToHex({ r: b, g, b: r }));
    }
  }

  let matrixBegin = 24;
  for (let i = 1; i <= matrixCount; i += 1) {
    const nameLen = new Uint8Array(ab.slice(matrixBegin, matrixBegin + 1))[0];

    const name = arrayBufferToString(ab, matrixBegin + 1, nameLen);

    const [x, y, z] = new Uint32Array(ab.slice(matrixBegin + 1 + nameLen, matrixBegin + 13 + nameLen));

    let [dx, dy, dz] = new Int32Array(ab.slice(matrixBegin + 13 + nameLen, matrixBegin + 25 + nameLen));

    dx -= dx_offset;
    dy -= dy_offset;
    dz -= dz_offset;

    if (compression === 0) {
      const data = new Uint8Array(ab, matrixBegin + 25 + nameLen, 4 * x * y * z);
      for (let iz = 0; iz < z; ++iz) {
        for (let iy = 0; iy < y; ++iy) {
          for (let ix = 0; ix < x; ix += 1) {
            const ia = 4 * (iz * y * x + iy * x + ix);
            if (data[ia + 3] > 0) {
              addValues(ix + dx, iy + dy, iz + dz, data[ia], data[ia + 1], data[ia + 2]);
            }
          }
        }
      }
      matrixBegin += 25 + nameLen + 4 * x * y * z;
    } else {
      const data = new Uint8Array(ab, matrixBegin + 25 + nameLen);

      let ia = 0;
      for (let iz = 0; iz < z; ++iz) {
        let index = 0;
        while (true) {
          ia += 4;
          if (data[ia - 4] === 6 && data[ia - 3] === 0 && data[ia - 2] === 0 && data[ia - 1] === 0) {
            break;
          }
          if (data[ia - 4] === 2 && data[ia - 3] === 0 && data[ia - 2] === 0 && data[ia - 1] === 0) {
            const count = data[ia] + (data[ia + 1] << 8) + (data[ia + 2] << 16) + (data[ia + 3] << 24);
            if (data[ia + 7] > 0) {
              for (let j = 0; j < count; ++j) {
                const ix = index % x;
                const iy = Math.floor(index / x);
                index++;
                addValues(ix + dx, iy + dy, iz + dz, data[ia + 4], data[ia + 5], data[ia + 6]);
              }
            } else {
              index += count;
            }
            ia += 8;
          } else {
            const ix = index % x;
            const iy = Math.floor(index / x);
            index++;
            if (data[ia - 1] > 0) {
              addValues(ix + dx, iy + dy, iz + dz, data[ia - 4], data[ia - 3], data[ia - 2]);
            }
          }
        }
      }
      matrixBegin += 25 + nameLen + ia;
    }
  }

  return { result };
};

function writeInt32LE(buffer: number[], val: number) {
  buffer.push(
    (val & 0x000000ff),
    (val & 0x0000ff00) >> 8,
    (val & 0x00ff0000) >> 16,
    (val & 0xff000000) >> 24
  );
}

function writeColor(buffer: number[], vox: number) {
  writeInt32LE(buffer, vox && (0xff000000 | vox) || 0);
};

export function exportQbFile(model: ndarray.Ndarray): ExportResult {
  const comp = true;

  const data = [
    1, 1, 0, 0, // version: 1.1.0.0 (current)
    1, 0, 0, 0, // color format: bgra
    0, 0, 0, 0, // z-axis orientation
    +comp, 0, 0, 0, // compression: no (1, 0, 0, 0 for compressed)
    0, 0, 0, 0, // visability mask: no partially visibility
    1, 0, 0, 0, // matrix count: 1
    5,          // name length: 5
    77, 111, 100, 101, 108, // name: Model
  ];

  const { shape } = model;

  for (let i = 0; i < shape.length; ++i) {
    writeInt32LE(data, shape[i]);
  }

  writeInt32LE(data, Math.floor(- shape[0] / 2));
  writeInt32LE(data, 0);
  writeInt32LE(data, Math.floor(- shape[2] / 2));

  if (comp) {
    for (let z = 0, lenZ = shape[2]; z < lenZ; ++z) {
      const vox = [];
      let lastVox = -1;
      for (let y = 0, lenY = shape[1]; y < lenY; ++y) {
        for (let x = 0, lenX = shape[0]; x < lenX; ++x) {
          const val = model.get(x, y, z);
          vox.push(val);
          if (val) lastVox = vox.length - 1;
        }
      }

      let i = 0;
      while (i <= lastVox) {
        let r: number;
        for (r = 1; i + r <= lastVox && vox[i + r - 1] === vox[i + r]; ++r) {}

        if (r > 1) {
          writeInt32LE(data, CODEFLAG);
          writeInt32LE(data, r);
        }

        writeColor(data, vox[i]);
        i += r;
      }
      writeInt32LE(data, NEXTSLICEFLAG);
    }
  } else {
    for (let z = 0, lenZ = shape[2]; z < lenZ; ++z) {
      for (let y = 0, lenY = shape[1]; y < lenY; ++y) {
        for (let x = 0, lenX = shape[0]; x < lenX; ++x) {
          if (model.get(x, y, z)) console.log(x, y, z, model.get(x, y, z));
          writeColor(data, model.get(x, y, z));
        }
      }
    }
  }

  return {
    result: new Uint8Array(data),
  };
}
