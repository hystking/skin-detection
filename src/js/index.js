export default function index() {
  // Calling the regl module with no arguments creates a full screen canvas and
  // WebGL context, and then uses this context to initialize a new REGL instance
  const regl = require('regl')()

  // Calling regl() creates a new partially evaluated draw command
  const drawTriangle = regl({

    // Shaders in regl are just strings.  You can use glslify or whatever you want
    // to define them.  No need to manually create shader objects.

    vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    const mat3 mv = mat3(
      2., 0., 0.,
      0., -2., 0.,
      -1., 1., 1.
    );

    void main() {
      uv = position;
      vec3 mvp = mv * vec3(position, 1.);
      gl_Position = vec4(mvp.x, mvp.y, 0., 1.);
    }`,

    frag: `
    precision mediump float;
    uniform vec4 color;
    varying vec2 uv;
    void main() {
      gl_FragColor = vec4(color.xyz * uv.x * uv.y, 1.);
    }`,

    // Here we define the vertex attributes for the above shader
    attributes: {
      // regl.buffer creates a new array buffer object
      position: regl.buffer([
        [0, 0],   // no need to flatten nested arrays, regl automatically
        [1, 0],
        [0, 1],    // unrolls them into a typedarray (default Float32)

        [1, 0],   // no need to flatten nested arrays, regl automatically
        [1, 1],    // unrolls them into a typedarray (default Float32)
        [0, 1],
      ])
      // regl automatically infers sane defaults for the vertex attribute pointers
    },

    uniforms: {
      // This defines the color of the triangle to be a dynamic variable
      color: regl.prop('color')
    },

    // This tells regl the number of vertices to draw in this command
    count: 6
  })

  // regl.frame() wraps requestAnimationFrame and also handles viewport changes
  regl.frame(({time}) => {
    // clear contents of the drawing buffer
    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1
    })

    // draw a triangle using the command defined above
    drawTriangle({
      color: [
        Math.cos(time * 1),
        Math.sin(time * 0.8),
        Math.cos(time * 3),
        1
      ]
    })
  })
}
