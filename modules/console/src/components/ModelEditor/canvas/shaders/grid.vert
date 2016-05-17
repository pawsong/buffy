attribute vec3 color;

varying vec2 vUV;
varying vec3 vColor;

void main(){
  vUV = uv;
  vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
