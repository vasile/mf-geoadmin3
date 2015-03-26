(function() {
  goog.provide('ga_feature_preview_directive');

  goog.require('ga_debounce_service');

  var module = angular.module('ga_feature_preview_directive', [
    'ga_debounce_service'
  ]);

  module.directive('gaFeaturePreview',
      function($translate, $http, $q, gaDebounce, gaGlobalOptions,
               gaLayerFilters, gaPreviewFeatures) {

        var parser = new ol.format.GeoJSON();
        var ID = '--ID--';
        var LAYER = '--LAYER--';
        var identifyUrl = gaGlobalOptions.apiUrl +
                          '/rest/services/all/MapServer/identify';
        var htmlurlTemplate = gaGlobalOptions.cachedApiUrl +
                              '/rest/services/all/MapServer/' + LAYER +
                              '/' + ID + '/htmlPopup';
        var imgLinkRegex = /href="(\/\/.*\/luftbilder\/viewer\.html\?.*)" tar/i;
        var imgPreviewRegex = /src="(\/\/.*\/tiles\/.*\/quickview\.jpg)" alt/i;

        var getGeometryParams = function(map, view) {
          var imgDisplay = map.getSize().concat([96]).join(',');
          var mapExtent = view.calculateExtent(map.getSize()).join(',');
          return {
            geometry: mapExtent,
            geometryType: 'esriGeometryEnvelope',
            mapExtent: mapExtent,
            imageDisplay: imgDisplay,
            tolerance: 0
          };
        };


        return {
          restrict: 'A',
          templateUrl: 'components/featurepreview/partials/featurepreview.html',
          scope: {
            map: '=gaFeaturePreviewMap'
          },
          link: function(scope, element, attrs) {
            var map = scope.map;
            var view = map.getView();
            scope.previews = [];
            scope.lubislayers = [];

            var canceler;

            var cancel = function() {
              scope.previews = [];
              if (canceler) {
                canceler.resolve();
              }
              canceler = $q.defer();
            };

            var getImage = function(f) {
              var url = htmlurlTemplate.replace(LAYER, f.layerBodId)
                        .replace(ID, f.featureId);
              $http.get(url, {
                cache: true,
                timeout: canceler.promise,
                params: {
                  lang: $translate.use()
                }
              }).success(function(res) {
                if (typeof res === 'string') {
                  var imglink = res.match(imgLinkRegex);
                  var imgpreview = res.match(imgPreviewRegex);
                  if (imglink && imgpreview &&
                      imglink.length === 2 &&
                      imgpreview.length === 2) {
                    scope.previews.push({
                      f: f,
                      link: imglink[1],
                      preview: imgpreview[1]
                    });
                  }
                }
              });
            };

            var extractFeaturesWithImages = function(data) {
              if (!data ||
                  !data.results ||
                  !data.results.length ||
                  data.results.length <= 0) {
                return;
              }
              for (var i = 0; i < data.results.length; i++) {
                getImage(data.results[i]);
              }

            };

            var update = function() {
              cancel();
              if (scope.lubislayers.length) {
                var lp = 'all:';
                for (var i = 0; i < scope.lubislayers.length; i++) {
                  lp += scope.lubislayers[i].id + ',';
                }
                lp.substring(0, lp.length - 1);
                var params = {
                  lang: $translate.use(),
                  geometryFormat: 'geojson',
                  layers: lp
                  //offset: offset,
                  //timeInstant: currentYear,
                };
                params = angular.extend(getGeometryParams(map, view), params);
                $http.get(identifyUrl, {
                  params: params,
                  cache: true,
                  timeout: canceler.promise
                }).success(function(data) {
                  extractFeaturesWithImages(data);
                }).error(function(data, status, headers, config) {
                });
              }
            };

            scope.highlight = function(feature) {
              var features = parser.readFeatures(feature);
              for (var i = 0, ii = features.length; i < ii; ++i) {
                features[i].set('layerId', feature.layerBodId);
                gaPreviewFeatures.add(map, features[i]);
              }
            };

            scope.clearHighlight = function() {
              gaPreviewFeatures.clear();
            };

            var debouncedUpdate = gaDebounce.debounce(update, 500, false);

            view.on('propertychange', debouncedUpdate);

            scope.layerFilter = function(l) {
              if (!gaLayerFilters.selectedAndVisible(l)) {
                return false;
              }
              if (l.id === 'ch.swisstopo.lubis-luftbilder_farbe' ||
                  l.id === 'ch.swisstopo.lubis-luftbilder_schwarzweiss' ||
                  l.id === 'ch.swisstopo.lubis-luftbilder-dritte-firmen' ||
                  l.id === 'ch.swisstopo.lubis-luftbilder-dritte-kantone' ||
                  l.id === 'ch.swisstopo.lubis-luftbilder_infrarot') {
                return true;
              }
              return false;
            };
            scope.layers = map.getLayers().getArray();
            scope.$watchCollection('layers | filter:layerFilter',
                                   function(olLayers) {
              scope.lubislayers = olLayers;
              debouncedUpdate();
            });


          }
        };
      }
  );
})();

