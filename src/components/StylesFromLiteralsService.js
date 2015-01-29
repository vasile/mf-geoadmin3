(function() {
  goog.provide('ga_styles_from_literals_service');

  var module = angular.module('ga_styles_from_literals_service', []);

  module.provider('gaStylesFromLiterals', function() {

    this.$get = function() {

      function getOlIcon(options) {
        return new ol.style.Icon({
          src: options.src,
          anchor: options.anchor ? options.anchor : [0.5, 0.5],
          anchorXUnits: options.anchorXUnits ?
              options.anchorXUnits : 'fraction',
          anchorYUnits: options.anchorYUnits ?
              options.anchorYUnits : 'fraction',
          opacity: options.opacity ? options.opacity : 1
        });
      }

      function getOlRegularShape(options, shape) {
        if (shape === 'circle') {
          return new ol.style.Circle({
            radius: options.radius,
            fill: options.fill,
            stroke: options.stroke
          });
        } else if (shape === 'icon') {
        } else {
          var shapes = {
            square: {
              fill: options.fill,
              stroke: options.stroke,
              points: 4,
              radius: options.radius,
              angle: Math.PI / 4
            }
          };
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
          if (type === 'image') {
            if (value.type === 'icon') {
              olStyle = getOlIcon(style);
            } else {
              var options = getOlBasicStyles(style);
              options.radius = value.radius;
              olStyle = getOlRegularShape(options, value.type);
            }
            olStyles[type] = olStyle;
          } else {
            olStyles[type] = getOlBasicStyles(style);
          }
        });
        return new ol.style.Style(olStyles);
      }

      function olStyleForPropertyValue(properties) {
        var property;
        var styles = {};

        for (var key in properties) {
          property = properties[key];
          this.key = key;
        }

        angular.forEach(property, function(value, k) {
          var propertyStyle = value;
          var olStyle = getOlStyleFromLiterals(propertyStyle);
          styles[k] = olStyle;
        });

        this.styles = styles;

        this.get = function(key) {
          return this.styles[key];
        };
      }

      return function(properties) {
        return new olStyleForPropertyValue(properties);
      };
    };
  });
})();
