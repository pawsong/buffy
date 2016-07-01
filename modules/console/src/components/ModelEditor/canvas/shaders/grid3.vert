varying vec2 vUV;

#if NUM_CLIPPING_PLANES > 0
  varying vec3 vViewPosition;
#endif

void main(){
  vUV = uv;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	#if NUM_CLIPPING_PLANES > 0
    vViewPosition = - mvPosition.xyz;
  #endif

  gl_Position = projectionMatrix * mvPosition;
}
