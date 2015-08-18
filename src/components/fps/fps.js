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

};


FPS.prototype.activate = function() {


};


FPS.prototype.deactivate = function() {
  var lla = this.camera_.positionCartographic;
  lla.height = 2000;
  this.scene_.camera.flyTo({
    destination: this.ellipsoid_.cartographicToCartesian(lla)
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
  }
};


FPS.prototype.tick = function() {
  var heading = this.camera_.heading;
  var pitch = this.camera_.pitch;

  // update camera orientation
  heading += this.movementX_ * 0.025;
  this.movementX_ = 0;

  pitch -= this.movementY_ * 0.025;
  pitch = Math.max(-Math.PI / 4, pitch);
  pitch = Math.min(Math.PI / 4, pitch);

  this.movementY_ = 0;

  // update camera position
  var moveAmount = this.buttons_.shift ? 8.0 : 2.0;
  if (this.buttons_.left) {
    this.camera_.moveLeft(moveAmount);
  }
  if (this.buttons_.right) {
    this.camera_.moveRight(moveAmount);
  }
  if (this.buttons_.forward) {
    this.camera_.moveForward(moveAmount);
  }
  if (this.buttons_.backward) {
    this.camera_.moveBackward(moveAmount);
  }

  var gpos = this.camera_.position;
  var lla = this.ellipsoid_.cartesianToCartographic(gpos);
  var groundAlt = Cesium.defaultValue(this.scene_.globe.getHeight(lla), 0.0);
  lla.height = groundAlt + 2; // 2m above ground


  // FIXME: clamp camera to the ground
  this.camera_.setView({
    positionCartographic: lla,
    heading: heading,
    pitch: pitch,
    roll : 0.0
  });


};
