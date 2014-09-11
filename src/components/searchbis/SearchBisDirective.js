(function() {
  goog.provide('ga_searchbis_directive');

  var module = angular.module('ga_searchbis_directive', []);

  module.directive('gaSearchBis',
      function($parse) {

        return {
          restrict: 'A',
          replace: true,
          //require: 'ngModel',
          templateUrl: 'components/searchbis/partials/searchbis.html',
          link: function(scope, element, attrs) {
            var modelValue = $parse(attrs.ngModel).assign;
            var inputEl = element.find('input[type=text]');

            scope.hasFocus = false;
            scope.matches = [];

            // Set match list dimensions
            var setMatchesListDimensions = function() {
              scope.position = {
                top: element.offset().top + element.height(),
                left: element.offset().left
              };
              scope.width = element.width();
            };
            setMatchesListDimensions();

            scope.inputValChange = function() {
              scope.matches = [inputEl.val()];
              if (inputEl.val() === '') {
                scope.matches = [];
              }
            };

            scope.isOpen = function() {
              return scope.matches.length > 0 && scope.hasFocus;
            };

            scope.selectActive = function(index) {
              console.log(index);
            };

            scope.selectDeactive = function(index) {
              console.log(index);
            };

            var resetMatches = function() {
              scope.matches = [];
              scope.activeIdx = -1;
            };

            scope.selectMatch = function(index) {
              console.log(index);
            };

            // Input events
            inputEl.on('blur', function() {
              console.log('blur');
              scope.$apply(function() {
                scope.hasFocus = false;
              });
            });
            inputEl.on('focus', function() {
              console.log('focus');
              scope.$apply(function() {
                scope.hasFocus = true;
              });
            });

            $(window).resize(function() {
              setMatchesListDimensions();
            });
          }
        };
      });
})();
