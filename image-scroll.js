
function Sketch(opts) {
    var _this = this;

    this.scene = new THREE.Scene();
    this.vertex = `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`;
    this.fragment = defaultShader;
    this.uniforms = opts.uniforms;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0);
    this.debug = opts.debug || false

    this.fallbackEl = document.getElementById(opts.fallbackId);
    this.trackedEl = document.getElementById(opts.trackedElId);
    this.trackedElOffset = this.trackedEl.offsetTop;
    this.trackedElPaddingTop = parseFloat(window.getComputedStyle(this.trackedEl).paddingTop);
    this.trackedElPaddingBottom = parseFloat(window.getComputedStyle(this.trackedEl).paddingBottom);
    this.trackedElEffectiveHeight = this.trackedEl.getBoundingClientRect().height - this.trackedElPaddingBottom - this.trackedElPaddingTop;
    this.documentHeight;

    this.container = document.getElementById(opts.containerId);
    this.images = JSON.parse(this.container.getAttribute('data-images'));
    this.imgDisplacement = this.container.getAttribute('data-image-displacement');

    this.ticking = false;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.001,
        1000
    );

    this.camera.position.set(0, 0, 2);
    this.time = 0;
    this.current = 0;
    this.textures = [];

    initiate(function () {
        hideFallback.call(_this);
        addListeners();
        settings.call(_this);
        addObjects.call(_this);
        resize.call(_this);
        render.call(_this);
        update();
    });

    function initiate(cb) {
        var error = false;
        var manager = new THREE.LoadingManager();
        var imgLoader = new THREE.TextureLoader(manager);
        imgLoader.setCrossOrigin('Anonymous');

        manager.onLoad = function () {
            if (!error) {
                cb();
            }
        }

        manager.onError = function () {
            error = true;
        }

        _this.images.forEach((url, i) => {
            imgLoader.load(url, function (img) {
                _this.textures[i] = img;
                _this.textures[i].minFilter = THREE.LinearFilter;
            });
        });
    }

    function hideFallback() {
        if (this.fallbackEl != null) {
            this.fallbackEl.style.display = 'none';
        }
    }

    function addListeners() {
        window.addEventListener('scroll', requestTick, false);
        window.addEventListener("resize", function () {
            resize.call(_this);
            update.call(_this);
        });
    }

    function resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;


        // image cover
        this.imageAspect = this.textures[0].image.height / this.textures[0].image.width;
        let a1; let a2;
        if (this.height / this.width > this.imageAspect) {
            a1 = (this.width / this.height) * this.imageAspect;
            a2 = 1;
        } else {
            a1 = 1;
            a2 = (this.height / this.width) / this.imageAspect;
        }

        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;

        const dist = this.camera.position.z;
        const height = 1;
        this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

        this.plane.scale.x = this.camera.aspect;
        this.plane.scale.y = 1;

        this.camera.updateProjectionMatrix();

        updateTrackedElDimensions();
    }

    function updateTrackedElDimensions() {
        _this.documentHeight = getDocHeight();
        _this.trackedElOffset = _this.trackedEl.offsetTop;
        _this.trackedElPaddingTop = parseFloat(window.getComputedStyle(_this.trackedEl).paddingTop);
        _this.trackedElPaddingBottom = parseFloat(window.getComputedStyle(_this.trackedEl).paddingBottom);
        _this.trackedElEffectiveHeight = _this.trackedEl.getBoundingClientRect().height - _this.trackedElPaddingBottom - _this.trackedElPaddingTop;

        function getDocHeight() {
            var doc = document;
            return Math.max(
                doc.body.scrollHeight, doc.documentElement.scrollHeight,
                doc.body.offsetHeight, doc.documentElement.offsetHeight,
                doc.body.clientHeight, doc.documentElement.clientHeight
            );
        }
    }

    function settings() {
        if (this.debug) this.gui = new dat.GUI();
        this.settings = { progress: 0.5 };
        // if(this.debug) this.gui.add(this.settings, "progress", 0, 1, 0.01);

        Object.keys(this.uniforms).forEach((item) => {
            this.settings[item] = this.uniforms[item].value;
            if (this.debug) this.gui.add(this.settings, item, this.uniforms[item].min, this.uniforms[item].max, 0.01);
        })
    }

    function addObjects() {
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                time: { type: "f", value: 0 },
                progress: { type: "f", value: 0 },
                border: { type: "f", value: 0 },
                intensity: { type: "f", value: 0 },
                scaleX: { type: "f", value: 40 },
                scaleY: { type: "f", value: 40 },
                transition: { type: "f", value: 40 },
                swipe: { type: "f", value: 0 },
                width: { type: "f", value: 0 },
                radius: { type: "f", value: 0 },
                texture1: { type: "f", value: this.textures[0] },
                texture2: { type: "f", value: this.textures[1] },
                displacement: { type: "f", value: new THREE.TextureLoader().load(this.imgDisplacement) },
                resolution: { type: "v4", value: new THREE.Vector4() },
            },
            vertexShader: this.vertex,
            fragmentShader: this.fragment
        });

        this.geometry = new THREE.PlaneGeometry(1, 1, 2, 2);

        this.plane = new THREE.Mesh(this.geometry, this.material);
        // this.plane.rotation.z = - 90 * Math.PI / 180;
        this.scene.add(this.plane);
    }

    function render() {
        // this.time += 0.05;
        // this.material.uniforms.time.value = this.time;
        this.material.uniforms.progress.value = this.progress;
        Object.keys(this.uniforms).forEach((item) => {
            this.material.uniforms[item].value = this.settings[item];
        });

        // this.camera.position.z = 3;
        // this.plane.rotation.y = 0.4*Math.sin(this.time)
        // this.plane.rotation.x = 0.5*Math.sin(0.4*this.time)

        requestAnimationFrame(render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    function requestTick() {
        if (!_this.ticking) {
            requestAnimationFrame(update);
            _this.ticking = true;
        }
    }

    function update() {
        var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;

        if (scrollTop < _this.trackedElOffset) {
            _this.progress = 0;
            _this.ticking = false;
            return;
        }

        if (scrollTop > _this.trackedElOffset + _this.trackedElEffectiveHeight) {
            _this.progress = 1;
            _this.ticking = false;
            return;
        }

        var percentageScrolled = (scrollTop - _this.trackedElOffset) / _this.trackedElEffectiveHeight * 100;
        if (percentageScrolled < 33.3) {
            _this.material.uniforms.texture1.value = _this.textures[0];
            _this.material.uniforms.texture2.value = _this.textures[1];
            _this.progress = THREE.Math.mapLinear(percentageScrolled, 0, 33.3, 0, 1);

        } else if (percentageScrolled >= 33.3 && percentageScrolled < 66.6) {
            _this.material.uniforms.texture1.value = _this.textures[1];
            _this.material.uniforms.texture2.value = _this.textures[2];
            _this.progress = THREE.Math.mapLinear(percentageScrolled, 33.3, 66.6, 0, 1);;
        }

        _this.ticking = false;
    }
}

var defaultShader = `
  uniform float time;
  uniform float progress;
  uniform float width;
  uniform float scaleX;
  // uniform float border;
  uniform float scaleY;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform sampler2D displacement;
  uniform vec4 resolution;

  varying vec2 vUv;
  varying vec4 vPosition;

  //	Classic Perlin 3D Noise 
  //	by Stefan Gustavson
  //
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec4 P){
    ;
    vec4 Pi0 = floor(P); // Integer part for indexing
    vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec4 Pf0 = fract(P); // Fractional part for interpolation
    vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 ixy00 = permute(ixy0 + iw0);
    vec4 ixy01 = permute(ixy0 + iw1);
    vec4 ixy10 = permute(ixy1 + iw0);
    vec4 ixy11 = permute(ixy1 + iw1);

    vec4 gx00 = ixy00 / 7.0;
    vec4 gy00 = floor(gx00) / 7.0;
    vec4 gz00 = floor(gy00) / 6.0;
    gx00 = fract(gx00) - 0.5;
    gy00 = fract(gy00) - 0.5;
    gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);

    vec4 gx01 = ixy01 / 7.0;
    vec4 gy01 = floor(gx01) / 7.0;
    vec4 gz01 = floor(gy01) / 6.0;
    gx01 = fract(gx01) - 0.5;
    gy01 = fract(gy01) - 0.5;
    gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);

    vec4 gx10 = ixy10 / 7.0;
    vec4 gy10 = floor(gx10) / 7.0;
    vec4 gz10 = floor(gy10) / 6.0;
    gx10 = fract(gx10) - 0.5;
    gy10 = fract(gy10) - 0.5;
    gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);

    vec4 gx11 = ixy11 / 7.0;
    vec4 gy11 = floor(gx11) / 7.0;
    vec4 gz11 = floor(gy11) / 6.0;
    gx11 = fract(gx11) - 0.5;
    gy11 = fract(gy11) - 0.5;
    gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);

    vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
    vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
    vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
    vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
    vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
    vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
    vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
    vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
    vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
    vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
    vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
    vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
    vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
    vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
    vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
    vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

    vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x;
    g0100 *= norm00.y;
    g1000 *= norm00.z;
    g1100 *= norm00.w;

    vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x;
    g0101 *= norm01.y;
    g1001 *= norm01.z;
    g1101 *= norm01.w;

    vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x;
    g0110 *= norm10.y;
    g1010 *= norm10.z;
    g1110 *= norm10.w;

    vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x;
    g0111 *= norm11.y;
    g1011 *= norm11.z;
    g1111 *= norm11.w;

    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);

    vec4 fade_xyzw = fade(Pf0);
    vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
    vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
    vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
    return 2.2 * n_xyzw;
  }


  float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  float parabola( float x, float k ) {
    return pow( 4. * x * ( 1. - x ), k );
  }


  void main()	{
      float dt = parabola(progress,1.);
      float border = 1.;
      vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
      vec4 color1 = texture2D(texture1,newUV);
      vec4 color2 = texture2D(texture2,newUV);
      vec4 d = texture2D(displacement,vec2(newUV.x*scaleX,newUV.y*scaleY));

      float realnoise = 0.5*(cnoise(vec4(newUV.x*scaleX  + 0.*time/3., newUV.y*scaleY,0.*time/3.,0.)) +1.);

      float w = width*dt;

      float maskvalue = smoothstep(1. - w,1.,vUv.x + mix(-w/2., 1. - w/2., progress));
      float maskvalue0 = smoothstep(1.,1.,vUv.x + progress);



      float mask = maskvalue + maskvalue*realnoise;
      // float mask = maskvalue;

      float final = smoothstep(border,border+0.01,mask);

      gl_FragColor = mix(color1,color2,final);
      // gl_FragColor =vec4(maskvalue0,final,0.,1.);
  }
`