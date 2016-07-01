precision highp float;

varying vec3 vColor;

void main(void) {
  gl_FragColor = vec4(vColor.rgb, 1.0);
}
