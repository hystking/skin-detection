export default function index() {

  navigator.getUserMedia({video: true}, handleVideo, e => console.error(e));

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
    uniform sampler2D texture;
    uniform vec4 color;
    varying vec2 uv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    void main() {
      vec3 tex = texture2D(texture, uv).xyz;
      vec3 hsv = rgb2hsv(tex);
      if(0. < hsv[0] && hsv[0] < .3) {
        gl_FragColor = vec4(color.xyz, 1.);
      } else {
        gl_FragColor = vec4(tex, 1.);
      }
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
      color: regl.prop('color'),
      texture: regl.prop('video'),
    },

    // This tells regl the number of vertices to draw in this command
    count: 6
  })

  function handleVideo(stream) {
    // video.src = 
    const video = document.createElement("video");

    var canPlay = false
    var loadedMetaData = false
    video.addEventListener('loadedmetadata', function () {
      loadedMetaData = true
      if (canPlay) {
        onComplete()
      }
    })
    video.addEventListener('canplay', function () {
      canPlay = true
      if (loadedMetaData) {
        onComplete()
      }
    })
    video.muted = true;
    video.autoplay = true
    video.loop = true
    video.crossOrigin = 'anonymous'
    video.srcObject = stream;

    function onComplete() {
      console.log("ready2");
      document.body.addEventListener("click", start);
      document.body.addEventListener("touchstart", start);
      function start(){
        document.body.removeEventListener("click", start);
        document.body.removeEventListener("touchstart", start);
        console.log("start");
        video.play()
        const texture = regl.texture(video)
        regl.frame(({time}) => {
          regl.clear({
            color: [0, 0, 0, 0],
            depth: 1
          })
          const texture = regl.texture(video)
          drawTriangle({
            color: [
              Math.cos(time * 10),
              Math.sin(time * 8),
              Math.cos(time * 30),
              1
            ],
            video: texture.subimage(video),
          })
        })
      }
    }

  }
}
