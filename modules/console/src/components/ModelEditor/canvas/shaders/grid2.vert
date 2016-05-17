varying vec3 vPos;
varying vec3 vNorm;

void main(){
  vNorm = normal;
  vPos = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
