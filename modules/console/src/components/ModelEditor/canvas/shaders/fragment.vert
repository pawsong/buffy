attribute vec3 color;

varying vec2 vUv;
varying vec3 vColor;

#if NUM_CLIPPING_PLANES > 0
  varying vec3 vViewPosition;
#endif

void main(){
  vUv = uv;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	#if NUM_CLIPPING_PLANES > 0
    vViewPosition = - mvPosition.xyz;
  #endif

  gl_Position = projectionMatrix * mvPosition;
}
