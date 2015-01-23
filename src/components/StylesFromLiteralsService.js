(function() {
  goog.provide('ga_styles_from_literals_service');

  var module = angular.module('ga_styles_from_literals_service', []);

  module.provider('gaStylesFromLiterals', function() {

    this.$get = function() {

      var properties = {
        'w-typ': {
          'river': {
            'image': {
              'type': 'square',
              'radius': 10,
              'fill': {
                'color': 'rgba(255, 255, 255, 0.6)'
              },
              'stroke': {
                'color': '#319FD3',
                'radius': 1
              }
            }
          },
          'lake': {
            'image': {
              'type': 'circle',
              'radius': 10,
              'fill': {
                'color': 'rgba(200, 200, 255, 0.6)'
              },
              'stroke': {
                'color': '#FFFFFF',
                'radius': 3
              }
            }
          }
        }
      };

      function getOlRegularShape(options, shape) {
        var shapes = {
          square: {
            fill: options.fill,
            stroke: options.stroke,
            points: 4,
            radius: options.radius,
            angle: Math.PI / 4
          }
        };
        if (shape === 'circle') {
          return new ol.style.Circle({
            radius: options.radius,
            fill: options.fill,
            stroke: options.stroke
          });
        } else {
          return new ol.style.RegularShape(shapes[shape]);
        }
      }

      function getOlBasicStyles(options) {
        var olStyles = {};
        angular.forEach(options, function(value, key) {
          var type = key;
          var style = value;
          if (type === 'stroke') {
            olStyles[type] = new ol.style.Stroke(style);
          } else if (type === 'fill') {
            olStyles[type] = new ol.style.Fill(style);
          } else if (type === 'text') {
            olStyles[type] = new ol.style.Text(style);
          }
        });
        return olStyles;
      }

      function getOlStyleFromLiterals(types) {
        var olStyles = {};
        angular.forEach(types, function(value, key) {
          var olStyle;
          var type = key;
          var style = value;
          if (type == 'image') {
            var options = getOlBasicStyles(style);
            var shape = value.type;
            options.radius = value.radius;
            olStyles[type] = getOlRegularShape(options, shape);
          } else {
            olStyles[type] = getOlBasicStyles(style);
          }
        });
        return new ol.style.Style(olStyles);
      }

      function olStyleForPropertyValue(properties, key) {
        var styles = {};
        var property = properties[key];

        angular.forEach(property, function(value, k) {
          var propertyStyle = value;
          var olStyle = getOlStyleFromLiterals(propertyStyle);
          styles[k] = olStyle;
        });

        this.key = key;

        this.styles = styles;

        this.get = function(key) {
          return this.styles[key];
        };
      }

      // Properties should be fetched via a service
      // The key should be part of the layer config
      var temp = new olStyleForPropertyValue(properties, 'w-typ');

      return function(properties, type) {
        return temp;
      };
    };
  });
})();
