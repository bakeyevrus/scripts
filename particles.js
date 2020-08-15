var test;
function AnimationController(containerId) {
    console.ward = function () { }; // what warnings?

    this.ingoreFirstCompleteEvent = true;
    // Set this starting value to true, as the first animation is done by default whenever default image is loaded
    this.shouldPlayReverseNext = true;
    this.lastImg = null;
    this.nextImg = null;
  
    this.containerEl = document.getElementById(containerId);
    this.slideImages = null;
    this.hoveredEl = null;
    this.lastHoveredEl = null;
  
    this.init = function () {
      var _this = this;
  
      preloadDefaultImage();
  
      function preloadDefaultImage() {
        var images = {};
        var error = false;
  
        var manager = new THREE.LoadingManager();
        var imgLoader = new THREE.ImageLoader(manager);
        imgLoader.setCrossOrigin('Anonymous');
    
        var defaultImgUrl = getDefaultImgUrl();
        imgLoader.load(defaultImgUrl, function (img) {
          images[defaultImgUrl] = img;
        });

        manager.onLoad = function () {
          if (!error) {
            _this.slideImages = images;
            initThreejs();
          }
        }

        manager.onError = function(url) {
          console.error('Cannot load ', url);
          error = true;
        }
      }
  
      function getDefaultImgUrl() {
        var targetEl = document.querySelector('[data-slide-default]');
        if (targetEl == null) {
          throw new Error('No element with \'data-slide-default\' attribute can be found in DOM');
        }
  
        var imgUrl = targetEl.getAttribute('data-slide-img');
  
        if (imgUrl == null) {
          throw new Error('Element with \'data-slide-default\' attribute defined should contain \'data-slide-img\' attribute');
        }
  
        return imgUrl;
      }
  
      function initThreejs() {
        var root = new THREERoot({
          createCameraControls: !true,
          antialias: (window.devicePixelRatio === 1),
          fov: 80,
        },
          _this.containerEl,
        );
  
        root.renderer.setClearColor(0x000000, 0);
        root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  
        root.camera.position.set(0, 0, 60);
        // z-distance of the camera
        var width = 80;
        var height = 80;
  
  
        var defaultImgUrl = getDefaultImgUrl();
  
        var slide = new Slide(width, height, 'out');
        root.scene.add(slide);
        // Set the first slide transparent to make the image 'appear' 
        slide.setImage(_this.slideImages[defaultImgUrl], true);
        _this.slide = slide;
  
  
        var slide2 = new Slide(width, height, 'in');
        root.scene.add(slide2);
        slide2.setImage(_this.slideImages[defaultImgUrl]);
        _this.slide2 = slide2;
  
        document.querySelector('[data-slide-default]').classList.add('active-slide');
  
  
        var timeline = new TimelineLite({
          autoRemoveChildren: false,
          onComplete: playNextAnimation,
          onCompleteParams: ["{self}"],
          onReverseComplete: playNextAnimation,
          onReverseCompleteParams: ["{self}"],
        });
        timeline.timeScale(2);
        _this.timeline = timeline;
  
        timeline.add(slide.transition(), 0);
        timeline.add(slide2.transition(), 0);
  
        loadAllImages();
      }
  
      function loadAllImages() {
        var manager = new THREE.LoadingManager();
        var imgLoader = new THREE.ImageLoader(manager);
        imgLoader.setCrossOrigin('Anonymous');
  
        manager.onLoad = function () {
          startListening();
        }

        manager.onError = function(url) {
          console.error('Cannot load ', url);
        }
  
        document.querySelectorAll('[data-slide-img]').forEach(function (el) {
          var imgUrl = el.getAttribute('data-slide-img');
          imgLoader.load(imgUrl, function (img) {
            _this.slideImages[imgUrl] = img;
          });
        });
      }
  
      function startListening() {
        document.querySelectorAll('[data-slide-img]').forEach(attachDataSlideListener);
        console.log('Initialized')
      }
  
      function attachDataSlideListener(elem) {
        elem.addEventListener('mouseenter', function () {
          _this.nextImg = elem.getAttribute('data-slide-img');
          _this.hoveredEl = this;
          playNextAnimation(_this.timeline);
        });
        elem.addEventListener('mouseleave', function () {
          _this.nextImg = null;
        });
      }
  
  
      function playNextAnimation(timeline) {
        if (_this.ingoreFirstCompleteEvent) {
          _this.ingoreFirstCompleteEvent = false;
          return;
        }
        if (timeline.isActive() || _this.nextImg == null || _this.lastImg == _this.nextImg) {
          return;
        }
  
        var images = _this.slideImages;
        var shouldPlayReverseAnimation = _this.shouldPlayReverseNext;
        var nextImg = _this.nextImg;
        shouldPlayReverseAnimation ? _this.slide.setImage(images[nextImg]) : _this.slide2.setImage(images[nextImg]);
        _this.lastImg = nextImg;
        _this.nextImg = null;      
        timeline.reversed(shouldPlayReverseAnimation);
        
        document.querySelector('.active-slide').classList.remove('active-slide');
        _this.hoveredEl.classList.add('active-slide');
        _this.shouldPlayReverseNext = !shouldPlayReverseAnimation;
  
      }
    }
  }
  
  
  ////////////////////
  // CLASSES
  ////////////////////
  
  function Slide(width, height, animationPhase) {
    var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);
  
    THREE.BAS.Utils.separateFaces(plane);
  
    var geometry = new SlideGeometry(plane);
  
    geometry.bufferUVs();
  
    var aAnimation = geometry.createAttribute('aAnimation', 2);
    var aStartPosition = geometry.createAttribute('aStartPosition', 3);
    var aControl0 = geometry.createAttribute('aControl0', 3);
    var aControl1 = geometry.createAttribute('aControl1', 3);
    var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  
    var i, i2, i3, i4, v;
  
    var minDuration = 0.8;
    var maxDuration = 1.2;
    var maxDelayX = 0.9;
    var maxDelayY = 0.125;
    var stretch = 0.11;
  
    this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;
  
    var startPosition = new THREE.Vector3();
    var control0 = new THREE.Vector3();
    var control1 = new THREE.Vector3();
    var endPosition = new THREE.Vector3();
  
    var tempPoint = new THREE.Vector3();
  
    function getControlPoint0(centroid) {
      var signY = Math.sign(centroid.y);
  
      tempPoint.x = THREE.Math.randFloat(0.1, 0.3) * 50;
      tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.3) * 70;
      tempPoint.z = THREE.Math.randFloatSpread(20);
  
      return tempPoint;
    }
  
    function getControlPoint1(centroid) {
      var signY = Math.sign(centroid.y);
  
      tempPoint.x = THREE.Math.randFloat(0.3, 0.6) * 50;
      tempPoint.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70;
      tempPoint.z = THREE.Math.randFloatSpread(20);
  
      return tempPoint;
    }
  
    for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
      var face = plane.faces[i];
      var centroid = THREE.BAS.Utils.computeCentroid(plane, face);
  
      // animation
      var duration = THREE.Math.randFloat(minDuration, maxDuration);
      var delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
      var delayY;
  
      if (animationPhase === 'in') {
        delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
      }
      else {
        delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
      }
  
      for (v = 0; v < 6; v += 2) {
        aAnimation.array[i2 + v] = delayX + delayY + (Math.random() * stretch * duration);
        aAnimation.array[i2 + v + 1] = duration;
      }
  
      // positions
  
      endPosition.copy(centroid);
      startPosition.copy(centroid);
  
      if (animationPhase === 'in') {
        control0.copy(centroid).sub(getControlPoint0(centroid));
        control1.copy(centroid).sub(getControlPoint1(centroid));
      }
      else { // out
        control0.copy(centroid).add(getControlPoint0(centroid));
        control1.copy(centroid).add(getControlPoint1(centroid));
      }
  
      for (v = 0; v < 9; v += 3) {
        aStartPosition.array[i3 + v] = startPosition.x;
        aStartPosition.array[i3 + v + 1] = startPosition.y;
        aStartPosition.array[i3 + v + 2] = startPosition.z;
  
        aControl0.array[i3 + v] = control0.x;
        aControl0.array[i3 + v + 1] = control0.y;
        aControl0.array[i3 + v + 2] = control0.z;
  
        aControl1.array[i3 + v] = control1.x;
        aControl1.array[i3 + v + 1] = control1.y;
        aControl1.array[i3 + v + 2] = control1.z;
  
        aEndPosition.array[i3 + v] = endPosition.x;
        aEndPosition.array[i3 + v + 1] = endPosition.y;
        aEndPosition.array[i3 + v + 2] = endPosition.z;
      }
    }
  
    var material = new THREE.BAS.BasicAnimationMaterial(
      {
        shading: THREE.FlatShading,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { type: 'f', value: 0 }
        },
        shaderFunctions: [
          THREE.BAS.ShaderChunk['cubic_bezier'],
          //THREE.BAS.ShaderChunk[(animationPhase === 'in' ? 'ease_out_cubic' : 'ease_in_cubic')],
          THREE.BAS.ShaderChunk['ease_in_out_cubic'],
          THREE.BAS.ShaderChunk['quaternion_rotation']
        ],
        shaderParameters: [
          'uniform float uTime;',
          'attribute vec2 aAnimation;',
          'attribute vec3 aStartPosition;',
          'attribute vec3 aControl0;',
          'attribute vec3 aControl1;',
          'attribute vec3 aEndPosition;',
        ],
        shaderVertexInit: [
          'float tDelay = aAnimation.x;',
          'float tDuration = aAnimation.y;',
          'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
          'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
          //'float tProgress = tTime / tDuration;'
        ],
        shaderTransformPosition: [
          (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
          'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
        ]
      },
      {
        map: new THREE.Texture(),
      }
    );
  
    THREE.Mesh.call(this, geometry, material);
  
    this.frustumCulled = false;
  }
  Slide.prototype = Object.create(THREE.Mesh.prototype);
  Slide.prototype.constructor = Slide;
  Object.defineProperty(Slide.prototype, 'time', {
    get: function () {
      return this.material.uniforms['uTime'].value;
    },
    set: function (v) {
      this.material.uniforms['uTime'].value = v;
    }
  });
  
  Slide.prototype.setImage = function (image, isTransparent) {
    test = this;
    this.material.uniforms.opacity.value = isTransparent ? 0 : 1;
    this.material.uniforms.map.value.image = image;
    this.material.uniforms.map.value.minFilter = THREE.LinearFilter;
    this.material.uniforms.map.value.needsUpdate = true;
  };
  
  Slide.prototype.transition = function () {
    return TweenMax.fromTo(this, 3.0, { time: 0.0 }, { time: this.totalDuration, ease: Power0.easeInOut });
  };
  
  
  function SlideGeometry(model) {
    THREE.BAS.ModelBufferGeometry.call(this, model);
  }
  SlideGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
  SlideGeometry.prototype.constructor = SlideGeometry;
  SlideGeometry.prototype.bufferPositions = function () {
    var positionBuffer = this.createAttribute('position', 3).array;
  
    for (var i = 0; i < this.faceCount; i++) {
      var face = this.modelGeometry.faces[i];
      var centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);
  
      var a = this.modelGeometry.vertices[face.a];
      var b = this.modelGeometry.vertices[face.b];
      var c = this.modelGeometry.vertices[face.c];
  
      positionBuffer[face.a * 3] = a.x - centroid.x;
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z;
  
      positionBuffer[face.b * 3] = b.x - centroid.x;
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z;
  
      positionBuffer[face.c * 3] = c.x - centroid.x;
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
  };
  
  
  function THREERoot(params, containerEl) {
    params = utils.extend({
      fov: 60,
      zNear: 10,
      zFar: 100000,
  
      createCameraControls: false
    }, params);
  
    this.renderer = new THREE.WebGLRenderer({
      antialias: params.antialias,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  
    this.parentContainer = containerEl;
    this.parentContainer.appendChild(this.renderer.domElement);
  
    this.camera = new THREE.PerspectiveCamera(
      params.fov,
      1,
      params.zNear,
      params.zfar
    );
  
    this.scene = new THREE.Scene();
  
    if (params.createCameraControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }
  
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
  
    this.resize();
    this.tick();
  
    window.addEventListener('resize', this.resize, false);
  }
  THREERoot.prototype = {
    tick: function () {
      this.update();
      this.render();
      requestAnimationFrame(this.tick);
    },
    update: function () {
      this.controls && this.controls.update();
    },
    render: function () {
      this.renderer.render(this.scene, this.camera);
    },
    resize: function () {
      var containerWidth = this.parentContainer.getBoundingClientRect().width;
  
      this.camera.aspect = 1;
      this.camera.updateProjectionMatrix();
  
      this.renderer.setSize(containerWidth, containerWidth);
    }
  };
  
  ////////////////////
  // UTILS
  ////////////////////
  
  var utils = {
    extend: function (dst, src) {
      for (var key in src) {
        dst[key] = src[key];
      }
  
      return dst;
    },
    randSign: function () {
      return Math.random() > 0.5 ? 1 : -1;
    },
    ease: function (ease, t, b, c, d) {
      return b + ease.getRatio(t / d) * c;
    },
    fibSpherePoint: (function () {
      var vec = { x: 0, y: 0, z: 0 };
      var G = Math.PI * (3 - Math.sqrt(5));
  
      return function (i, n, radius) {
        var step = 2.0 / n;
        var r, phi;
  
        vec.y = i * step - 1 + (step * 0.5);
        r = Math.sqrt(1 - vec.y * vec.y);
        phi = i * G;
        vec.x = Math.cos(phi) * r;
        vec.z = Math.sin(phi) * r;
  
        radius = radius || 1;
  
        vec.x *= radius;
        vec.y *= radius;
        vec.z *= radius;
  
        return vec;
      }
    })(),
    spherePoint: (function () {
      return function (u, v) {
        u === undefined && (u = Math.random());
        v === undefined && (v = Math.random());
  
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
  
        var vec = {};
        vec.x = (Math.sin(phi) * Math.cos(theta));
        vec.y = (Math.sin(phi) * Math.sin(theta));
        vec.z = (Math.cos(phi));
  
        return vec;
      }
    })()
  };