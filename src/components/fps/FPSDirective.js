goog.provide('ga_fps_directive');

goog.require('fps');
goog.require('goog.asserts');
(function() {

  var module = angular.module('ga_fps_directive', []);

  module.directive('gaFps', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/fps/partials/fps.html',
      scope: {
        ol3d: '=gaFpsOl3d'
      },
      link: function(scope, element, attrs) {

        var ol3d = scope.ol3d;
        goog.asserts.assert(goog.isDef(ol3d));

        var scene = ol3d.getCesiumScene();
        var canvas = scene.canvas;

        var fps = new FPS(scene);

        document.addEventListener('mousemove', fps.onMouseMove.bind(fps),
            false);
        document.addEventListener('keydown', fps.onKey.bind(fps), false);
        document.addEventListener('keyup', fps.onKey.bind(fps), false);

        var onPointerLockChange = function(event) {
          if (document.pointerLockElement || document.mozPointerLockElement) {
            scene.screenSpaceCameraController.enableInputs = false;
            scene.postRender.addEventListener(fps.tick, fps);
            fps.activate();
          } else {
            scene.screenSpaceCameraController.enableInputs = true;
            scene.postRender.removeEventListener(fps.tick, fps);
            fps.deactivate();
          }
        };
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockchange', onPointerLockChange);

        scope.activate = function() {
          if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
          } else if (canvas.mozRequestPointerLock) {
            canvas.mozRequestPointerLock();
          }
        };

      }
    };
  });
})();
