(function() {
  goog.provide('ga_map_select_interactions_service');

  var module = angular.module('ga_map_select_interactions_service', []);

  module.provider('gaMapSelectInteractions', function() {
    // Ol bug https://github.com/openlayers/ol3/issues/2666

    this.$get = function() {
      var select,
          olActiveLayers;

      var addActiveLayer = function(olVectorLayer) {
        var i;
        for (i = 0; i < olActiveLayers.length; i++) {
          if (olActiveLayers[i].get('bodId') === olVectorLayer.get('bodId')) {
            olActiveLayers[i] = olVectorLayer;
          } else {
            olActiveLayers.push(olVectorLayer);
          }
        }
      };

      var removeActiveLayer = function(olVectorLayer) {
        var i;
        for (i = 0; i < olActiveLayers.length; i++) {
          if (olActiveLayers[i].get('bodId') === olVectorLayer.get('bodId')) {
            olActiveLayers = olActiveLayers.splice(i);
          }
        }
      };

      var updateInteractionsSelect = function(map, olVectorLayers, toAdd) {
        var i;
        for (i = 0; i < olVectorLayers.length; i++) {
          if (toAdd) {
            addActiveLayer(olVectorLayers[i]);
          } else {
            removeActiveLayer(olVectorLayers[i]);
          }
        }

        map.removeInteraction(select);
        if (olActiveLayers) {
          var newSelect = new ol.interaction.Select({
            condition: ol.events.condition.mouseMove,
            layers: olActiveLayers
          });
          return newSelect;
        }
      };

      return {
        add: function(map, olVectorLayers) {
          if (!select) {
            // Init reference to active layers
            olActiveLayers = olVectorLayers;
            select = new ol.interaction.Select({
              condition: ol.events.condition.mouseMove,
              layers: olVectorLayers
            });
            map.addInteraction(select);
          } else {
            select = updateInteractionsSelect(map, olVectorLayers, true);
            map.addInteraction(select);
          }
        },
        remove: function(map, olVectorLayers) {
          if (select) {
            select = updateInteractionsSelect(map, olVectorLayers, false);
          }
        }
      };
    };
  });
})();
