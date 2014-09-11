(function() {
  goog.provide('ga_searchbis_controller');

  var module = angular.module('ga_searchbis_controller', []);

  module.controller('GaSearchBisController',
      function($scope, gaGlobalOptions) {
          var topicPlaceHolder = '--DUMMYTOPIC--';
          $scope.selected = undefined;

          $scope.options = {
            searchUrl: gaGlobalOptions.apiUrl + '/rest/services/' +
                        topicPlaceHolder + '/SearchServer?',
            featureUrl: gaGlobalOptions.cachedApiUrl +
                        '/rest/services/{Topic}/MapServer/{Layer}/{Feature}',
            applyTopicToUrl: function (url, topic) {
              return url.replace(topicPlaceHolder, topic);
            }
          };
        });

})();
