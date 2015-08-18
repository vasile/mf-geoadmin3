goog.provide('fps');

function FPS(scene) {

  /**
   * @private
   */
  this.scene_ = scene;

  /**
   * @private
   */
  this.camera_ = scene.camera;

  /**
   * @private
   */
  this.ellipsoid_ = scene.globe.ellipsoid;

  /**
   * @private
   */
  this.buttons_ = {
    shift: false,
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  /**
   * @private
   */
  this.movementX_ = 0;

  /**
   * @private
   */
  this.movementY_ = 0;

  /**
   * @private
   */
  this.canTick_ = false;

  /**
   * @private
   */
  this.previousTime_ = undefined;

  /**
   * In meters/second.
   * @const
   * @private
   */
  this.walkSpeed_ = 4 * 1000 / 3600;

  /**
   * In meters/second.
   * @const
   * @private
   */
  this.runSpeed_ = 10 * 1000 / 3600;

  /**
   * Number of meters above terrain.
   * @private
   */
  this.heightAboveTerrain_ = 4;

  /**
   * @private
   */
  this.plane_ = false;
};

FPS.prototype.setPlane = function(plane) {
  this.plane_ = plane;
  if (this.plane_) {
    this.heightAboveTerrain_ = 400;
  } else {
    this.heightAboveTerrain_ = 4;
  }
}


FPS.prototype.activate = function() {
  var lla = this.camera_.positionCartographic;
  lla.height = this.heightAboveTerrain_;
  this.scene_.camera.flyTo({
    destination: this.ellipsoid_.cartographicToCartesian(lla),
    duration: 3,
    orientation: {
      heading: this.scene_.camera.heading,
      pitch: 0,
      roll: 0
    },
    complete: function() {
      this.canTick_ = true;
    }.bind(this)
  });
};


FPS.prototype.deactivate = function() {
  var lla = this.camera_.positionCartographic;
  lla.height = 4000;
  this.scene_.camera.flyTo({
    duration: 3,
    destination: this.ellipsoid_.cartographicToCartesian(lla),
    orientation: {
      heading: this.scene_.camera.heading,
      pitch: - Math.PI / 4, // with -PI/2 transition points to sky
      roll: 0
    }
  });
};


FPS.prototype.onMouseMove = function(event) {
  this.movementX_ += goog.isDef(event.movementX) ? event.movementX : event.mozMovementX;
  this.movementY_ += goog.isDef(event.movementY) ? event.movementY : event.mozMovementY;
};


FPS.prototype.onKey = function(event) {
  var pressed = event.type == 'keydown';
  this.buttons_.shift = event.shiftKey;
  if (event.keyCode == 65 || event.keyCode == 37) {
    // A or Left.
    this.buttons_.left = pressed;
  } else if (event.keyCode == 68 || event.keyCode == 39) {
    // D or Right.
    this.buttons_.right = pressed;
  } else if (event.keyCode == 87 || event.keyCode == 38) {
    // W or Up.
    this.buttons_.forward = pressed;
  } else if (event.keyCode == 83 || event.keyCode == 40) {
    // S or Down.
    this.buttons_.backward = pressed;
  } else if (event.keyCode == 70) {
    // F
    this.setPlane(!event.shiftKey);
  }
};


FPS.prototype.tick = function() {
  var heading = this.camera_.heading;
  var pitch = this.camera_.pitch;

  // update camera orientation
  if (this.plane_) {
    var angle = Cesium.Math.convertLongitudeRange(this.camera_.roll);
    if (Math.abs(angle) > 0.25) {
      this.movementX_ = angle / 4;
    }
  }
  heading += this.movementX_ * 0.025;
  this.movementX_ = 0;

  pitch -= this.movementY_ * 0.025;
  pitch = Math.max(-Math.PI / 4, pitch);
  pitch = Math.min(Math.PI / 4, pitch);

  this.movementY_ = 0;

  if (!this.canTick_) {
    return;
  }

  var now = new Date().getTime();
  if (!this.previousTime_) {
    this.previousTime_ = now;
  }

  var dt = now - this.previousTime_;
  this.previousTime_ = now;

  // update camera position
  // 50x faster than the pysical speed
  var speed = this.buttons_.shift ? this.runSpeed_ : this.walkSpeed_;
  var moveAmount = 50 * speed * dt / 1000;
  if (this.buttons_.left) {
    this.plane_ ? this.camera_.twistLeft() : this.camera_.moveLeft(moveAmount);
  }
  if (this.buttons_.right) {
    this.plane_ ? this.camera_.twistRight() : this.camera_.moveRight(moveAmount);
  }
  if (this.buttons_.forward || this.plane_) {
    this.camera_.moveForward(moveAmount);
  }
  if (this.buttons_.backward) {
    this.camera_.moveBackward(moveAmount);
  }

  var gpos = this.camera_.position;
  var lla = this.ellipsoid_.cartesianToCartographic(gpos);
  var groundAlt = Cesium.defaultValue(this.scene_.globe.getHeight(lla), 0.0);
  lla.height = groundAlt + this.heightAboveTerrain_;

  // FIXME: clamp camera to the ground
  this.camera_.setView({
    positionCartographic: lla,
    heading: heading,
    pitch: pitch
  });


};
