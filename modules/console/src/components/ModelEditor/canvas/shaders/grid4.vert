varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNorm;

void main(){
  vUv = uv;
  vPos = position;
  vNorm = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
