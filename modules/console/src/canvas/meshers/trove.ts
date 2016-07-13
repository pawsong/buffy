import ndarray from 'ndarray';

import {
  isTransparent,
  makeGetter,
} from '../../trove/format';

//Cache buffer internally
let mask = new Int32Array(4096);
let invMask = new Int32Array(4096);

const ATTACHMENT_COLOR = 0x01FF00FF;

export default function(
  array: ndarray.Ndarray, typeArray: ndarray.Ndarray, alphaArray: ndarray.Ndarray, specularArray: ndarray.Ndarray
) {
  const f = makeGetter(array, typeArray, alphaArray, specularArray);

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
