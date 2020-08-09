window.addEventListener('DOMContentLoaded', function () {
    initParticlesAnimation();

    function initParticlesAnimation() {
        var animationController = new AnimationController('three-container');
        animationController.init();
    }
});