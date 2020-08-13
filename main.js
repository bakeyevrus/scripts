window.addEventListener('DOMContentLoaded', function () {
    initParticlesAnimation();
    initImageScrollAnimaton();

    function initParticlesAnimation() {
        var animationController = new AnimationController('three-container');
        animationController.init();
    }

    function initImageScrollAnimaton() {
        new Sketch({
            containerId: 'slider',
            fallbackId: 'slider-fallback',
            trackedElId: 'portfolio',
            debug: false,
            uniforms: {
                width: { value: 0.5, type: 'f', min: 0, max: 10 },
                scaleX: { value: 40, type: 'f', min: 0.1, max: 60 },
                scaleY: { value: 40, type: 'f', min: 0.1, max: 60 },
                // border: {value: 1, type:'f', min:0., max:1},
            },
        });
    }
});