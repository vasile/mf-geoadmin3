(function() {
  goog.provide('ga_url_magic_controller');

  goog.require('ga_urlutils_service');

  var module = angular.module('ga_url_magic_controller', [
    'ga_urlutils_service'
  ]);

  module.controller('GaUrlMagicController',
      function($scope, $window, gaGlobalOptions, gaUrlUtils) {
        var map = $scope.map;
        // Getting our magic words with...magic.
        var magicWords = gaUrlUtils.getPathName($window.location).split(
            gaUrlUtils.getPathName(gaGlobalOptions.mapUrl))[1].split('/').
            filter(function(val) {
              return angular.isString(val) && val !== "";
            });
        if (!angular.isArray(magicWords) ||
            !magicWords.length) {
          return;
        }

        //For now, we only treat the first and assume we look for communes



        $window.console.log(magicWords);

      });

})();
