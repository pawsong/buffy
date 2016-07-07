attribute vec3 color;

#if NUM_CLIPPING_PLANES > 0
  varying vec3 vViewPosition;
#endif

varying vec2 vUv;
varying vec3 vColor;

void main(){
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	#if NUM_CLIPPING_PLANES > 0
    vViewPosition = - mvPosition.xyz;
  #endif

  vUv = uv;
  vColor = color;
  gl_Position = projectionMatrix * mvPosition;
}
