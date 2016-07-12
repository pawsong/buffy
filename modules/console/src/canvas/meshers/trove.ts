import ndarray from 'ndarray';

const TYPE1 = 0xffffff;
const TYPE2 = 0x808080;
const TYPE3 = 0x404040;
const TYPE4 = 0xff0000;
const TYPE5 = 0xffff00;

const ALPHA1 = 0x101010;
const ALPHA2 = 0x303030;
const ALPHA3 = 0x505050;
const ALPHA4 = 0x707070;
const ALPHA5 = 0x909090;
const ALPHA6 = 0xB0B0B0;
const ALPHA7 = 0xD0D0D0;
const ALPHA8 = 0xF0F0F0;

const SPECULAR1 = 0x800000;
const SPECULAR2 = 0x008000;
const SPECULAR3 = 0x000080;
const SPECULAR4 = 0x808000;
const SPECULAR5 = 0x800080;

const TYPE1_ALPHA1_SPECULAR1 = 0x01000000; // 01
const TYPE1_ALPHA1_SPECULAR2 = 0x02000000; // 02
const TYPE1_ALPHA1_SPECULAR3 = 0x03000000; // 03
const TYPE1_ALPHA1_SPECULAR4 = 0x04000000; // 04
const TYPE1_ALPHA1_SPECULAR5 = 0x05000000; // 05

const TYPE4_ALPHA1_SPECULAR1 = 0x06000000; // 06

const TYPE2_ALPHA1_SPECULAR1 = 0x07000000; // 07
const TYPE2_ALPHA2_SPECULAR1 = 0x08000000; // 08
const TYPE2_ALPHA3_SPECULAR1 = 0x09000000; // 09
const TYPE2_ALPHA4_SPECULAR1 = 0x0a000000; // 10
const TYPE2_ALPHA5_SPECULAR1 = 0x0b000000; // 11
const TYPE2_ALPHA6_SPECULAR1 = 0x0c000000; // 12
const TYPE2_ALPHA7_SPECULAR1 = 0x0d000000; // 13
const TYPE2_ALPHA8_SPECULAR1 = 0x0e000000; // 14

const TYPE3_ALPHA1_SPECULAR1 = 0x0f000000; // 15
const TYPE3_ALPHA2_SPECULAR1 = 0x10000000; // 16
const TYPE3_ALPHA3_SPECULAR1 = 0x11000000; // 17
const TYPE3_ALPHA4_SPECULAR1 = 0x12000000; // 18
const TYPE3_ALPHA5_SPECULAR1 = 0x13000000; // 19
const TYPE3_ALPHA6_SPECULAR1 = 0x14000000; // 20
const TYPE3_ALPHA7_SPECULAR1 = 0x15000000; // 21
const TYPE3_ALPHA8_SPECULAR1 = 0x16000000; // 22

const TYPE5_ALPHA1_SPECULAR1 = 0x17000000; // 23
const TYPE5_ALPHA2_SPECULAR1 = 0x18000000; // 24
const TYPE5_ALPHA3_SPECULAR1 = 0x19000000; // 25
const TYPE5_ALPHA4_SPECULAR1 = 0x1a000000; // 26
const TYPE5_ALPHA5_SPECULAR1 = 0x1b000000; // 27
const TYPE5_ALPHA6_SPECULAR1 = 0x1c000000; // 28
const TYPE5_ALPHA7_SPECULAR1 = 0x1d000000; // 29
const TYPE5_ALPHA8_SPECULAR1 = 0x1e000000; // 30

const INVALID                = 0xff000000;

function getMeta(type: number, alpha: number, specular: number) {
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
  return INVALID;
}

function isTransparent(v: number) {
  return (v & 0xff000000) >= TYPE2_ALPHA1_SPECULAR1;
}

//Cache buffer internally
let mask = new Int32Array(4096);
let invMask = new Int32Array(4096);

const ATTACHMENT_COLOR = 0x01FF00FF;

export default function(
  array: ndarray.Ndarray, typeArray: ndarray.Ndarray, alphaArray: ndarray.Ndarray, specularArray: ndarray.Ndarray
) {
  function f(i,j,k) {
    const c = array.get(i, j, k);
    if (!c) return;
    else if (c === ATTACHMENT_COLOR) return ATTACHMENT_COLOR;

    const type = (typeArray.get(i, j, k) & 0xffffff) || TYPE1;
    const alpha = (alphaArray.get(i, j, k) & 0xffffff) || ALPHA1;
    const specular = (specularArray.get(i, j, k) & 0xffffff) || SPECULAR1;

    const m = getMeta(type, alpha, specular);
    return m | (c & 0xffffff);
  }

  const dims = array.shape;

  var vertices = [], faces = [];
  var tVertices = [], tFaces = [];

  //Sweep over 3-axes
  for(var d=0; d<3; ++d) {
    var i, j, k, l, w, W, h, n, c
      , u = (d+1)%3
      , v = (d+2)%3
      , x = [0,0,0]
      , q = [0,0,0]
      , du = [0,0,0]
      , dv = [0,0,0]
      , dimsD = dims[d]
      , dimsU = dims[u]
      , dimsV = dims[v]
      , xd

    if (mask.length < dimsU * dimsV) {
      mask = new Int32Array(dimsU * dimsV);
      invMask = new Int32Array(dimsU * dimsV);
    }

    q[d] =  1;
    x[d] = -1;

    // Compute mask
    while (x[d] < dimsD) {
      xd = x[d]
      n = 0;

      for(x[v] = 0; x[v] < dimsV; ++x[v]) {
        for(x[u] = 0; x[u] < dimsU; ++x[u], ++n) {
          // Modified to read through getType()
          var a = xd >= 0      && f(x[0]       , x[1]       , x[2]       )
            , b = xd < dimsD-1 && f(x[0] + q[0], x[1] + q[1], x[2] + q[2])

          // both are transparent, add to both directions
          if (isTransparent(a) && isTransparent(b)) {
            if (a === b) {
              mask[n] = 0;
              invMask[n] = 0;
            } else {
              mask[n] = a;
              invMask[n] = b;
            }
          // if a is solid and b is not there or transparent
          } else if (a && (!b || isTransparent(b))) {
            mask[n] = a;
            invMask[n] = 0
          // if b is solid and a is not there or transparent
          } else if (b && (!a || isTransparent(a))) {
            mask[n] = 0
            invMask[n] = b;
          // dont draw this face
          } else {
            mask[n] = 0
            invMask[n] = 0
          }
        }
      }

      ++x[d];

      // Generate mesh for mask using lexicographic ordering
      function generateMesh(mask, dimsV, dimsU, vertices, faces, clockwise) {
        var n, j, i, c, w, h, k, du = [0,0,0], dv = [0,0,0];
        n = 0;
        for (j=0; j < dimsV; ++j) {
          for (i=0; i < dimsU; ) {
            c = mask[n];
            if (!c) {
              i++;  n++; continue;
            }

            //Compute width
            w = 1;
            while (c === mask[n+w] && i+w < dimsU) w++;

            //Compute height (this is slightly awkward)
            for (h=1; j+h < dimsV; ++h) {
              k = 0;
              while (k < w && c === mask[n+k+h*dimsU]) k++
              if (k < w) break;
            }

            // Add quad
            // The du/dv arrays are reused/reset
            // for each iteration.
            du[d] = 0; dv[d] = 0;
            x[u]  = i;  x[v] = j;

            if (clockwise) {
            // if (c > 0) {
              dv[v] = h; dv[u] = 0;
              du[u] = w; du[v] = 0;
            } else {
              // c = -c;
              du[v] = h; du[u] = 0;
              dv[u] = w; dv[v] = 0;
            }

            // ## enable code to ensure that transparent faces are last in the list
            // if (!isTransparent(c)) {
              var vertex_count = vertices.length;
              vertices.push([x[0],             x[1],             x[2]            ]);
              vertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
              vertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
              vertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
              faces.push([vertex_count, vertex_count+1, vertex_count+2, vertex_count+3, c]);
            // } else {
            //   var vertex_count = tVertices.length;
            //   tVertices.push([x[0],             x[1],             x[2]            ]);
            //   tVertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
            //   tVertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
            //   tVertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
            //   tFaces.push([vertex_count, vertex_count+1, vertex_count+2, vertex_count+3, removeFlags(c)]);
            // }

            //Zero-out mask
            W = n + w;
            for(l=0; l<h; ++l) {
              for(k=n; k<W; ++k) {
                mask[k+l*dimsU] = 0;
              }
            }

            //Increment counters and continue
            i += w; n += w;
          }
        }
      }
      generateMesh(mask, dimsV, dimsU, vertices, faces, true)
      generateMesh(invMask, dimsV, dimsU, vertices, faces, false)
    }
  }

  // ## enable code to ensure that transparent faces are last in the list
  // var vertex_count = vertices.length;
  // var newFaces = tFaces.map(function(v) {
  //   return [vertex_count+v[0], vertex_count+v[1], vertex_count+v[2], vertex_count+v[3], v[4]]
  // })
  //
  // return { vertices:vertices.concat(tVertices), faces:faces.concat(newFaces) };

  // TODO: Try sorting by texture to see if we can reduce draw calls.
  // faces.sort(function sortFaces(a, b) {
  //   return b[4] - a[4];
  // })
  return { vertices:vertices, faces:faces };
}
