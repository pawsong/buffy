precision highp float;

#include <clipping_planes_pars_fragment>

uniform float gridThickness;
uniform vec3 gridColor;

varying vec2 vUV;

void main(void) {
  #if NUM_CLIPPING_PLANES > 0
      for ( int i = 0; i < NUM_CLIPPING_PLANES; ++ i ) {
          vec4 plane = clippingPlanes[ i ];
          if ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;
      }
  #endif

  vec2 thickness = vec2(gridThickness, gridThickness);

  vec2 f = fract(vUV);
  f = min(f, 1.0 - f);

  vec2 delta = fwidth(f);
  f = smoothstep(f - delta, f + delta, thickness);

  float c = clamp(f.x + f.y, 0.0, 1.0);
  gl_FragColor = vec4(gridColor, c);
}
