/*!
 * Cuberto Magnetic
 *
 * @version 1.5.0
 * @author Cuberto (cuberto.com)
 * @licence Copyright (c) 2020, Cuberto. All rights reserved.
 */

function Magnetic(el, options) {
    this.el = el;
    this.options = {
        y: 0.4,
        x: 0.4,
        s: 0.2,
        rs: 0.7
    };

    this.y = 0;
    this.x = 0;
    this.width = 0;
    this.height = 0;

    if (this.el.getAttribute('magnetic-init')) return;
    this.el.setAttribute('magnetic-init', true);

    this.attachListeners();
}

Magnetic.prototype.attachListeners = function () {
    this.el.addEventListener('mouseenter', function () {
        // Getting top-left coordinates of the element relative to the browser window
        this.y = this.el.getBoundingClientRect().top;
        this.x = this.el.getBoundingClientRect().left;
        this.width = this.el.offsetWidth;
        this.height = this.el.offsetHeight;
    }.bind(this));

    this.el.addEventListener('mousemove', function (e) {
        const y = (e.clientY - this.y - this.height / 2) * this.options.y;
        const x = (e.clientX - this.x - this.width / 2) * this.options.x;

        this.move(x, y, this.options.s);
    }.bind(this));

    this.el.addEventListener('mouseleave', function (e) {
        this.move(0, 0, this.options.rs);
    }.bind(this));
}

Magnetic.prototype.move = function (x, y, speed) {
    TweenLite.to(this.el, speed, {
        y: y,
        x: x,
        force3D: true,
        overwrite: true,
    });
}
