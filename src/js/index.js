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
    uniform float time;
    varying vec2 uv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec2 distorted(vec2 p, vec2 centre, float freq){
      vec2 v = p - centre;
      // Convert to polar coords:
      float theta  = atan(v.y,v.x);
      float radius = length(v);

      // Distort:
      radius = pow(radius, 1. + sin(time * freq) * .5) * .7;

      // Convert back to Cartesian:
      v.x = radius * cos(theta);
      v.y = radius * sin(theta);

      return v + centre;
    }

    void main() {
      vec2 dc = vec2(.5, .5) + vec2(cos(time), sin(time)) * .3;
      vec2 dc2 = vec2(.5, .5) + vec2(cos(-time * 2.), sin(-time * 2.)) * .2;
      vec3 tex = texture2D(texture, distorted(distorted(uv, dc, 2.), dc2, -.3)).xyz;
      vec3 hsv = rgb2hsv(tex);
      if(0. < hsv[0] && hsv[0] < .1 && .8 > hsv[2] && hsv[2] > .5) {
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
      time: regl.prop('time'),
    },

    // This tells regl the number of vertices to draw in this command
    count: 6
  })

  function handleVideo(stream) {

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
    console.log(video)
    video.muted = true;
    video.autoplay = true
    video.loop = true
    video.crossOrigin = 'anonymous'
    video.srcObject = stream;
    video.webkitPlaysinline = true;
    video.playsinline = true;
    video.controls = false;
    video.style.objectFit = 'initial';
    video.style.position = 'absolute'
    video.style.top = '0px'
    video.style.left = '0px'
    video.style.zIndex = '-2'
    document.body.appendChild(video);

    function onComplete() {
      console.log("ready2");
      document.body.addEventListener("mousedown", start);
      document.body.addEventListener("touchstart", start);
      function start(e){
        e.preventDefault();
        document.body.removeEventListener("mousedown", start);
        document.body.removeEventListener("touchstart", start);
        console.log("start");
        video.play()
        const texture = regl.texture(video)
        regl.frame(({time}) => {
          /*
          regl.clear({
            color: [0, 0, 0, 0],
            depth: 1
          })
          */
          drawTriangle({
            color: [
              Math.cos(time * 10),
              Math.sin(time * 8),
              Math.cos(time * 30),
              1
            ],
            video: texture.subimage(video),
            time: time,
          })
        })
      }
    }

  }
}
