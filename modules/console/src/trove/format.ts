import { Ndarray } from 'ndarray';

export const TYPE1 = 0xffffff;
export const TYPE2 = 0x808080;
export const TYPE3 = 0x404040;
export const TYPE4 = 0xff0000;
export const TYPE5 = 0xffff00;

export const ALPHA1 = 0x101010;
export const ALPHA2 = 0x303030;
export const ALPHA3 = 0x505050;
export const ALPHA4 = 0x707070;
export const ALPHA5 = 0x909090;
export const ALPHA6 = 0xB0B0B0;
export const ALPHA7 = 0xD0D0D0;
export const ALPHA8 = 0xF0F0F0;

export const SPECULAR1 = 0x800000;
export const SPECULAR2 = 0x008000;
export const SPECULAR3 = 0x000080;
export const SPECULAR4 = 0x808000;
export const SPECULAR5 = 0x800080;

export const TYPE1_ALPHA1_SPECULAR1 = 0x01000000; // 01
export const TYPE1_ALPHA1_SPECULAR2 = 0x02000000; // 02
export const TYPE1_ALPHA1_SPECULAR3 = 0x03000000; // 03
export const TYPE1_ALPHA1_SPECULAR4 = 0x04000000; // 04
export const TYPE1_ALPHA1_SPECULAR5 = 0x05000000; // 05

export const TYPE4_ALPHA1_SPECULAR1 = 0x06000000; // 06

export const TYPE2_ALPHA1_SPECULAR1 = 0x07000000; // 07
export const TYPE2_ALPHA2_SPECULAR1 = 0x08000000; // 08
export const TYPE2_ALPHA3_SPECULAR1 = 0x09000000; // 09
export const TYPE2_ALPHA4_SPECULAR1 = 0x0a000000; // 10
export const TYPE2_ALPHA5_SPECULAR1 = 0x0b000000; // 11
export const TYPE2_ALPHA6_SPECULAR1 = 0x0c000000; // 12
export const TYPE2_ALPHA7_SPECULAR1 = 0x0d000000; // 13
export const TYPE2_ALPHA8_SPECULAR1 = 0x0e000000; // 14

export const TYPE3_ALPHA1_SPECULAR1 = 0x0f000000; // 15
export const TYPE3_ALPHA2_SPECULAR1 = 0x10000000; // 16
export const TYPE3_ALPHA3_SPECULAR1 = 0x11000000; // 17
export const TYPE3_ALPHA4_SPECULAR1 = 0x12000000; // 18
export const TYPE3_ALPHA5_SPECULAR1 = 0x13000000; // 19
export const TYPE3_ALPHA6_SPECULAR1 = 0x14000000; // 20
export const TYPE3_ALPHA7_SPECULAR1 = 0x15000000; // 21
export const TYPE3_ALPHA8_SPECULAR1 = 0x16000000; // 22

export const TYPE5_ALPHA1_SPECULAR1 = 0x17000000; // 23
export const TYPE5_ALPHA2_SPECULAR1 = 0x18000000; // 24
export const TYPE5_ALPHA3_SPECULAR1 = 0x19000000; // 25
export const TYPE5_ALPHA4_SPECULAR1 = 0x1a000000; // 26
export const TYPE5_ALPHA5_SPECULAR1 = 0x1b000000; // 27
export const TYPE5_ALPHA6_SPECULAR1 = 0x1c000000; // 28
export const TYPE5_ALPHA7_SPECULAR1 = 0x1d000000; // 29
export const TYPE5_ALPHA8_SPECULAR1 = 0x1e000000; // 30

export const INVALID_META           = 0xff000000;

export const ATTACHMENT_COLOR = 0x01FF00FF;

export function getMeta(type: number, alpha: number, specular: number) {
  switch(type) {
    case TYPE1: {
      switch(specular) {
        case SPECULAR1: {
          return TYPE1_ALPHA1_SPECULAR1;
        }
        case SPECULAR2: {
          return TYPE1_ALPHA1_SPECULAR2;
        }
        case SPECULAR3: {
          return TYPE1_ALPHA1_SPECULAR3;
        }
        case SPECULAR4: {
          return TYPE1_ALPHA1_SPECULAR4;
        }
        case SPECULAR5: {
          return TYPE1_ALPHA1_SPECULAR5;
        }
      }
      break;
    }
    case TYPE2: {
      switch(alpha) {
        case ALPHA1: {
          return TYPE2_ALPHA1_SPECULAR1;
        }
        case ALPHA2: {
          return TYPE2_ALPHA2_SPECULAR1;
        }
        case ALPHA3: {
          return TYPE2_ALPHA3_SPECULAR1;
        }
        case ALPHA4: {
          return TYPE2_ALPHA4_SPECULAR1;
        }
        case ALPHA5: {
          return TYPE2_ALPHA5_SPECULAR1;
        }
        case ALPHA6: {
          return TYPE2_ALPHA6_SPECULAR1;
        }
        case ALPHA7: {
          return TYPE2_ALPHA7_SPECULAR1;
        }
        case ALPHA8: {
          return TYPE2_ALPHA8_SPECULAR1;
        }
      }
      break;
    }
    case TYPE3: {
      switch(alpha) {
        case ALPHA1: {
          return TYPE3_ALPHA1_SPECULAR1;
        }
        case ALPHA2: {
          return TYPE3_ALPHA2_SPECULAR1;
        }
        case ALPHA3: {
          return TYPE3_ALPHA3_SPECULAR1;
        }
        case ALPHA4: {
          return TYPE3_ALPHA4_SPECULAR1;
        }
        case ALPHA5: {
          return TYPE3_ALPHA5_SPECULAR1;
        }
        case ALPHA6: {
          return TYPE3_ALPHA6_SPECULAR1;
        }
        case ALPHA7: {
          return TYPE3_ALPHA7_SPECULAR1;
        }
        case ALPHA8: {
          return TYPE3_ALPHA8_SPECULAR1;
        }
      }
      break;
    }
    case TYPE4: {
      return TYPE4_ALPHA1_SPECULAR1;
    }
    case TYPE5: {
      switch(alpha) {
        case ALPHA1: {
          return TYPE5_ALPHA1_SPECULAR1;
        }
        case ALPHA2: {
          return TYPE5_ALPHA2_SPECULAR1;
        }
        case ALPHA3: {
          return TYPE5_ALPHA3_SPECULAR1;
        }
        case ALPHA4: {
          return TYPE5_ALPHA4_SPECULAR1;
        }
        case ALPHA5: {
          return TYPE5_ALPHA5_SPECULAR1;
        }
        case ALPHA6: {
          return TYPE5_ALPHA6_SPECULAR1;
        }
        case ALPHA7: {
          return TYPE5_ALPHA7_SPECULAR1;
        }
        case ALPHA8: {
          return TYPE5_ALPHA8_SPECULAR1;
        }
      }
      break;
    }
  }
  return INVALID_META;
}

export function isTransparent(v: number) {
  return (v & 0xff000000) >= TYPE2_ALPHA1_SPECULAR1;
}

export function makeGetter(base: Ndarray, typeMap: Ndarray, alphaMap: Ndarray, specularMap: Ndarray) {
  const getTypeMap = typeMap
    ? (x: number, y: number, z: number) => (typeMap.get(x, y, z) & 0xffffff) || TYPE1
    : () => TYPE1;

  const getAlphaMap = alphaMap
    ? (x: number, y: number, z: number) => (alphaMap.get(x, y, z) & 0xffffff) || ALPHA1
    : () => ALPHA1;

  const getSpecularMap = specularMap
    ? (x: number, y: number, z: number) => (specularMap.get(x, y, z) & 0xffffff) || SPECULAR1
    : () => SPECULAR1;

  return (x: number, y: number, z: number) => {
    const c = base.get(x, y, z);
    if (!c) return;
    else if (c === ATTACHMENT_COLOR) return ATTACHMENT_COLOR;

    const m = getMeta(getTypeMap(x, y, z), getAlphaMap(x, y, z), getSpecularMap(x, y, z));
    return m | (c & 0xffffff);
  }
}
