precision highp float;
uniform vec3 color;
uniform float opacity;
uniform vec3 scale;

varying vec3 vNorm;
varying vec3 vPos;

void main(void) {
  vec3 thickness = vec3(0.01, 0.01, 0.01);

  vec3 fp = fract(vPos * scale);
  fp = min(fp, 1.0 - fp);

  vec3 delta = fwidth(fp);
  fp = smoothstep(fp - delta, fp + delta, thickness);
  fp = abs(cross(fp, vNorm));

  float c = clamp(fp.x + fp.y + fp.z, 0.0, 0.4) - 1.0;

  // gl_FragColor = vec4(color * -c, opacity);
  gl_FragColor = vec4(color * -c, 0.5);
}
