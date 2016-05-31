precision highp float;

uniform float gridThickness;
uniform vec3 gridColor;
uniform vec3 scale;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNorm;

void main(void) {
  // Edge
  vec2 eThickness = vec2(gridThickness, gridThickness) / 2.0;

  vec2 ef = fract(vUv);
  ef = min(ef, 1.0 - ef);

  vec2 eDelta = fwidth(ef);
  ef = smoothstep(ef - eDelta, ef + eDelta, eThickness);

  // Grid
  vec3 thickness = vec3(gridThickness, gridThickness, gridThickness);

  vec3 fp = fract(vPos / scale);
  fp = min(fp, 1.0 - fp);

  vec3 delta = fwidth(fp);
  fp = smoothstep(fp - delta, fp + delta, thickness);
  fp = abs(cross(fp, vNorm));

  float opacity = clamp(ef.x + ef.y + fp.x + fp.y + fp.z, 0.0, 1.0);

  gl_FragColor = vec4(gridColor, opacity);
}
