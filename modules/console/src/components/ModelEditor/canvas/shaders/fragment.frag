precision highp float;

#include <clipping_planes_pars_fragment>

uniform vec3 gridColor;
uniform float gridThickness;
uniform float opacity;

varying vec2 vUv;
varying vec3 vColor;

void main(void) {
  #if NUM_CLIPPING_PLANES > 0
    for ( int i = 0; i < NUM_CLIPPING_PLANES; ++ i ) {
      vec4 plane = clippingPlanes[ i ];
      if ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;
    }
  #endif

  vec2 thickness = vec2(gridThickness, gridThickness);

  vec2 f = fract(vUv);
  f = min(f, 1.0 - f);

  vec2 delta = fwidth(f);
  f = smoothstep(f - delta, f + delta, thickness);

  float w = clamp(f.x + f.y, 0.0, 1.0);
  vec3 c = vColor * (1.0 - w) + gridColor * w;

  gl_FragColor = vec4(c, max(opacity, w));
}
