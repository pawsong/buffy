import SpriteCameras, { getCameraId } from './SpriteCameras';

const surfaces = [
  'left', 'right', 'top', 'bottom', 'front', 'back',
];

const GRID_SIZE = 16;

function rgb2hex(r, g, b) {
  return b | (g << 8) | (r << 16);
}

export default function shapeCarve(dims, sprites, mask_color, skip) {
  //console.log('ShapeCarve');

  const x = new Int32Array(3);
  const volume = new Int32Array(dims[0] * dims[1] * dims[2]);
  const depth = [];

  const views = [];
  surfaces.forEach((surface, index) => {
    const { front, up, flip, transform } = SpriteCameras[surface];
    const left = up.clone().cross(front);

    // Create view data buffer
    const view = new Int32Array(GRID_SIZE * GRID_SIZE);
    const viewLen = view.length;
    for (let i = 0; i < viewLen; ++i) {
      view[i] = mask_color;
    }

    const cameraId = getCameraId(front, up);
    const sprite = sprites.get(cameraId);
    if (sprite) {
      //console.log('sprite');
      sprite.forEach(pixel => {
        const position = new THREE.Vector3(
          pixel.position.x, pixel.position.y, pixel.position.z
        );

        if (false && flip) {
          position.add(flip.clone().multiplyScalar(
            GRID_SIZE - 2 * flip.dot(pixel.position) + 1
          ));
        }

        let h = Math.abs(left.dot(position)) - 1;
        let v = Math.abs(up.dot(position)) - 1;

        const { color } = pixel;
        if (transform) {
          view[v + h * GRID_SIZE] = rgb2hex(color.r, color.g, color.b);
        } else {
          view[h + v * GRID_SIZE] = rgb2hex(color.r, color.g, color.b);
        }
      });
    }

    views.push(view);
  });

  views.forEach(function (view, i) {
    view.forEach(function (item, j) {
      if (item !== 0) {
        //        console.log(`i=${i} j=${j} c=${item}`);
      }
    });
  });
  //console.log('ShapeCarve end');

  // Initialize volume
  for(let i = 0; i < volume.length; ++i) {
    volume[i] = -1;
  }

  // Initialize depth fields
  for(let d = 0; d < 3; ++d) {
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;

    for(let s = 0; s <= dims[d] - 1; s += dims[d] - 1) {
      const vals = new Int32Array(dims[u] * dims[v]);
      const view = views[depth.length];
      const s_op = (s === 0) ? dims[d]-1 : 0;
      for(let i = 0; i < vals.length; ++i) {
        vals[i] = (!skip[depth.length] && view[i] === mask_color) ? s_op : s;
      }
      depth.push(vals);
    }

    //Clear out volume
    for(x[v] = 0; x[v] < dims[v]; ++x[v]) {
      for(x[u] = 0; x[u] < dims[u]; ++x[u]) {
        for(x[d] = depth[2 * d + 1][x[u] + x[v] * dims[u]];
            x[d] <= depth[2 * d][x[u] + x[v] * dims[u]]; ++x[d]) {
              volume[x[0] + dims[0] * (x[1] + dims[1] * x[2])] = mask_color;
            }
      }
    }
  }

  //Perform iterative seam carving until convergence
  let removed = 1;
  while(removed > 0) {
    removed = 0;
    for(let d = 0; d < 3; ++d) {
      const u = (d + 1) % 3;
      const v = (d + 2) % 3;

      //Do front/back sweep
      for(let s = -1; s <= 1; s += 2) {
        var v_num = 2*d + ((s<0) ? 1 : 0);
        if(skip[v_num]) { continue; }

        const aview = views[v_num];
        const adepth = depth[v_num];

        for(x[v] = 0; x[v] < dims[v]; ++x[v]) {
          for(x[u] = 0; x[u] < dims[u]; ++x[u]) {

            //March along ray
            const buf_idx = x[u] + x[v]*dims[u];
            for(x[d] = adepth[buf_idx]; 0 <= x[d] && x[d] < dims[d]; x[d] += s) {

              //Read volume color
              const vol_idx = x[0] + dims[0] * (x[1] + dims[1] * x[2]);
              let color = volume[vol_idx];
              if(color === mask_color) { continue; }

              color = volume[vol_idx] = aview[x[u] + dims[u] * x[v]];

              //Check photoconsistency of volume at x
              var consistent = true;
              for(var a = 0; consistent && a < 3; ++a) {
                const b = (a + 1) % 3;
                const c = (a + 2) % 3;
                const idx = x[b] + dims[b] * x[c];
                for(let t = 0; t < 2; ++t) {
                  var fnum = 2 * a + t;
                  if(skip[fnum]) { continue; }

                  const fcolor = views[fnum][idx];
                  const fdepth = depth[fnum][idx];
                  if(t ?  fdepth <= x[a] : x[a] <= fdepth) {
                    if(fcolor !== color) {
                      consistent = false;
                      break;
                    }
                  }
                }
              }

              if(consistent) { break; }

              //Clear out voxel
              ++removed;
              volume[vol_idx] = mask_color;
            }

            //Update depth value
            adepth[buf_idx] = x[d];
          }
        }
      }
    }
  }

  //Do a final pass to fill in any missing colors
  var n = 0;
  for(x[2] = 0; x[2] < dims[2]; ++x[2]) {
    for(x[1] = 0; x[1] < dims[1]; ++x[1]) {
      for(x[0] = 0; x[0] < dims[0]; ++x[0], ++n) {
        if(volume[n] < 0) {
          volume[n] = 0xff00ff;
        }
      }
    }
  }

  return { volume, dims };
}
