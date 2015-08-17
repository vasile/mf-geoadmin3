function FPS(scene) {

  this.scene_ = scene;

  this.camera_ = scene.camera;

  this.buttons_ = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  this.movementX_ = 0;
  this.movementY_ = 0;


};


FPS.prototype.activate = function() {


};

FPS.prototype.deactivate = function() {


};

FPS.prototype.onMouseMove = function(event) {
  this.movementX_ += event.movementX;
  this.movementY_ += event.movementY;
};

FPS.prototype.onKey = function(event) {
  var pressed = event.type == 'keydown';
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
  pitch = Math.max(-Math.PI / 2, pitch);
  pitch = Math.min(Math.PI / 2, pitch);

  this.movementY_ = 0;

  // update camera position
  var moveAmount = 1.0;
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

  // FIXME: clamp camera to the ground
  this.camera_.setView({
    heading: heading,
    pitch: pitch,
    roll : 0.0
  });


};
