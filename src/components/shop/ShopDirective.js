goog.provide('ga_shop_directive');
goog.require('ga_map_service');
(function() {

  var module = angular.module('ga_shop_directive', [
    'ga_map_service'
  ]);

  module.directive('gaShop', function($window, gaLang, gaLayers) {
    return {
      restrict: 'A',
      templateUrl: function(element, attrs) {
        return 'components/shop/partials/shop.html';
      },
      scope: {
        map: '=gaShopMap',
        feature: '=gaShopFeature'
      },
      link: function(scope, elt, attrs, controller) {

        // Remove the element if no feature defined
        if (!scope.feature) {
          elt.remove();
          return;
        }

        var layerBodId = (scope.feature instanceof ol.Feature) ?
            scope.feature.get('layerId') : scope.feature.layerBodId;

        // Remove the element if no layerBodId associated
        if (!layerBodId) {
          elt.remove();
          return;
        }
        var layerConfig = gaLayers.getLayer(layerBodId);
        if (/skitouren/.test(layerBodId)) {
          layerConfig.shop_option_arr = ['mapsheet'];
        }
        if (/pixelkart/.test(layerBodId)) {
          layerConfig.shop_option_arr = [
            'mapsheet',
            'commune',
            'district',
            'canton',
            'rectangle',
            'whole'
          ];
        }

        // Remove the element if no shop config available
        if (!layerConfig || !layerConfig.shop_option_arr ||
            layerConfig.shop_option_arr.length == 0) {
          elt.remove();
          return;
        }

        scope.orderTypes = layerConfig.shop_option_arr;
        scope.orderType = scope.orderTypes[0];

        // {mapsheet,commune,district,canton,rectangle,whole}
        // Order a mapsheet
        scope.orderMapsheet = function() {
          window.open('http://www.toposhop.admin.ch/?lang=' + gaLang.get() +
              '&' + layerBodId + '=' + scope.feature.id);
        };
        scope.chooseOrderType = function(ifScope) {
          scope.orderType = ifScope.orderType;
          var cap = scope.orderType.charAt(0).toUpperCase() +
              scope.orderType.substr(1).toLowerCase();
          var func = scope['order' + cap];
          if (typeof func == 'function') {
            func();
          } else {
            $window.console.log('order' + cap + ' not supported yet !');
          }
        };
      }

    };
  });
})();
