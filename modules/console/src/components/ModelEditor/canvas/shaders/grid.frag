precision highp float;

uniform float opacity;

varying vec2 vUV;
varying vec3 vColor;

void main(void) {
    float thickness = 0.01;

    float x = fract(vUV.x);
    x = min(x, 1.0 - x);

    float xdelta = fwidth(x);
    x = smoothstep(x - xdelta, x + xdelta, thickness);

    float y = fract(vUV.y);
    y = min(y, 1.0 - y);

    float ydelta = fwidth(y);
    y = smoothstep(y - ydelta, y + ydelta, thickness);

    float c = clamp(x + y, 0.0, 0.4) - 1.0;

    gl_FragColor = vec4(vColor.rgb * -c, opacity);
}
