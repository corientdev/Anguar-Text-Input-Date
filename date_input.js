var demoApp = angular.module('App', []);

demoApp.controller('DateInputCtrl', function($scope) {
  $scope.keypress;
  $scope.keydown;
  $scope.log;
  $scope.date = "04/07/2016";
});

demoApp.directive('dateInput', ['cursor', function (cursor) {
  return {
    require: 'ngModel',
    scope: {
      modelFormat: '@',
      viewFormat: '@',
      formattedDate: '=',
      keypress: '=',
      keydown: '=',
      log: '='
    },
    controller: function ($scope, $attrs) {

      $scope.date = {
        year: 'yyyy',
        month: 'mm',
        day: 'dd'
      };
      $scope.defaultModelFormat = 'yyyy/mm/dd';
      $scope.defaultModelFormats = {
        1: 'yyyy',
        2: 'yyyy/mm',
        3: 'yyyy/mm/dd'
      };
      $scope.defaultViewFormat = 'mm/dd/yyyy';
      $scope._modelFormat = $scope.modelFormat || $scope.defaultModelFormat;
      $scope._viewFormat = $scope.viewFormat || $scope.defaultViewFormat;

      var leftoverDatePart = '';

      /**
       * Parses the date (from dom) into the view format by checking for several potential formats
       * only run for first "initial" dom value.
       * @param date String, a date string in modelFormat (maybe)
       * @return String, date in viewFormat; if cannot be parsed by any known format viewFormat
       */
      $scope.parseModel = function (date) {
        var datePart, modelFormatPart, matches;
        var dateParts = date.split(/\D+/);
        var modelFormats = ['yyyy/mm/dd', 'mm/dd/yyyy', 'yyyy/mm', 'mm/yyyy', 'yyyy'];

        // Be sure to parse these two if they are not already in the list of parse formats.
        // Ensure modelFormat is always tried first, then viewFormat, then our others
        var iv = modelFormats.indexOf($scope._viewFormat);
          if(iv != -1) {
            modelFormats.splice(iv, 1);
          }
        //modelFormats.remove($scope._viewFormat);
        modelFormats.unshift($scope._viewFormat);
        
        var iw = modelFormats.indexOf($scope._modelFormat);
          if(iw != -1) {
            modelFormats.splice(iw, 1);
          }
        //modelFormats.remove($scope._modelFormat);
        modelFormats.unshift($scope._modelFormat);

        for (var i = 0, len = modelFormats.length; i < len; i++) {
          var modelFormatParts = modelFormats[i].split(/\W+/);
          if (modelFormatParts.length <= dateParts.length) {
            for (matches = 0; matches < modelFormatParts.length; matches++) {
              datePart = dateParts[matches];
              modelFormatPart = modelFormatParts[matches];
              if (datePart.length === modelFormatPart.length) {
                setScopeDatePart(datePart, modelFormatPart);
              } else {
                break;
              }
            }
            if (matches === modelFormatParts.length) {
              return formatFromScopeDate($scope._viewFormat);
            }
          }
        }
        // No matches, return mm/dd/yyyy or the view format
        $scope.resetDate();
        return $scope._viewFormat;
      };

      /**
       * Parses the date (user entered) using the view format
       * @param date String, a date string in viewFormat
       * @return String, a date string also in viewFormat, coerced and improved.
       */
      $scope.formatView = function (date) {
        var datePart, formatPart;
        var dateParts = date.replace(/[a-z]+/gi, '').split(/\W+/);
        var delimiters = dateParts.length;
        var formatParts = $scope._viewFormat.split(/\W+/);
        for (var i = 0 ; i < dateParts.length && i < formatParts.length ; i++) {
          datePart = dateParts[i];
          formatPart = formatParts[i];
          leftoverDatePart = '';
          // If the date part is longer than the format part, then take format-part amount from the
          // date, and put the remainder into the array as the next element to parse.
          // eg. parse '121929' as 'mm' 'yyyy', parse 12 as mm, 1929 as yyyy
          if (delimiters === 1 && datePart.length > formatPart.length) {
            dateParts.splice(i + 1, 0, datePart.slice(formatPart.length));
            datePart = datePart.slice(0, formatPart.length);
          }
          setScopeDatePart(datePart, formatPart);
          if (leftoverDatePart) {
            if (dateParts[i + 1]) {
              // If there's another part, prepend the leftover to it
              dateParts[i + 1] = leftoverDatePart + dateParts[i + 1];
            } else {
              dateParts.splice(i + 1, 0, leftoverDatePart);
            }
          }
        }
        var output = formatFromScopeDate($scope._viewFormat);
        // if there are no digits, empty string causes directive to show the placeholder text
        return output.match(/\d/) ? output : '';
      };

      /**
       * Formats the internal scope.date into a formatted data string in modelFormat
       * @return String, date in modelFormat
       */
      $scope.formatModel = function () {
        // detecting lack of specification of model format.
        var modelFormat = $scope.modelFormat;
        // choose 'yyyy/mm/dd', 'yyyy/mm', 'yyyy' when the modelFormat is unspecified
        if (!modelFormat) {
          var viewParts = $scope._viewFormat.split(/[^mdy]+/i);
          modelFormat = $scope.defaultModelFormats[viewParts.length];
        }
        return formatFromScopeDate(modelFormat);
      };

      $scope.resetDate = function () {
        $scope.date = {
          year: 'yyyy',
          month: 'mm',
          day: 'dd'
        };
      };

      var setScopeDatePart = function (datePart, formatPart) {
        if (formatPart === 'mm') {
          datePart = formatMonth(datePart);
          $scope.date.month = datePart;
        } else if (formatPart === 'dd') {
          datePart = formatDay(datePart);
          $scope.date.day = datePart;
        } else if (formatPart === 'yyyy') {
          datePart = formatYear(datePart);
          $scope.date.year = datePart;
        }
      };

      /**
       * Formats internal scope.date in the given date format.
       * @param format
       * @returns String, date string form internal scope.state in the given format.
       */
      var formatFromScopeDate = function (format) {
        var output = format;
        var formatParts = format.split(/\W+/);
        for (var i = 0, len = formatParts.length; i < len; i++) {
          var formatPart = formatParts[i];
          if (formatPart === 'mm') {
            output = output.replace(/\bmm\b/gi, $scope.date.month);
          } else if (formatPart === 'yyyy') {
            output = output.replace(/\byyyy\b/gi, $scope.date.year);
          } else if (formatPart === 'dd') {
            output = output.replace(/\bdd\b/gi, $scope.date.day);
          }
        }
        return output.slice(0, format.length);
      };

      /**
       * Formats the month to automatically promote 1-digit months to 2-digits
       * @month a month string
       */
      var formatMonth = function (month) {
        if (month.length > 2) {
          leftoverDatePart = month;
          return 'mm';
        } else if (month.length === 2) {
          if (month > 12) {
            leftoverDatePart = month.slice(1, 2);
            return '0' + month.slice(0, 1);
          }
        } else if (month.length === 1 && month > 1) {
          return '0' + month;
        }
        return month + 'mm'.slice(0, 2 - month.length);
      };

      /**
       * Formats the day to automatically promote 1-digit days to 2-digits
       * @day a day string
       */
      var formatDay = function (day) {
        if (day.length > 2) {
          leftoverDatePart = day;
          return 'dd';
        } else if (day.length === 2) {
          if (day > 31) {
            leftoverDatePart = day.slice(1, 2);
            return '0' + day.slice(0, 1);
          }
        } else if (day.length === 1 && day > 3) {
          return '0' + day;
        }
        return day + 'dd'.slice(0, 2 - day.length);
      };

      /**
       * Formats the year to turn 2-digit years into the nearest, valid 4-digit year
       * @year a year string
       */
      var formatYear = function (year) {
        if (year.length === 2 && year !== '19' && year !== '20') {
          var month = $scope.date.month.replace(/[mdy]+/gi, '')-1 || 0;
          var day = $scope.date.day.replace(/[mdy]+/gi, '') || 1;
          var futureYear = '20' + year.replace(/[mdy]+/gi, '');
          var futureDate = new Date(futureYear, month, day);
          var futureValid = false;
          var pastYear = '19' + year.replace(/[mdy]+/gi, '');
          var pastDate = new Date(pastYear, month, day);
          var pastValid = false;
          if (isWithinDateRange(futureDate, false)) {
            year = futureYear;
            futureValid = true;
          }
          if (isWithinDateRange(pastDate, false)) {
            year = pastYear;
            pastValid = true;
          }
          if (futureValid && pastValid || (!futureValid && !pastValid)) {
            year = getCloserYear(futureYear, pastYear);
          }
        }
        return year + 'yyyy'.slice(0, 4 - year.length);
      };

      var getCloserYear = function (futureYear, pastYear) {
        var thisYear = new Date().getFullYear();
        return Math.abs(futureYear - thisYear) < Math.abs(pastYear - thisYear) ? futureYear : pastYear;
      };

      $scope.isValidDate = function (date) {
        var valid = false;
        if (!date || date.match(/[mdy]/)) {
          valid = false;
        } else if (isCompleteDate(date)) {
          var viewFormat = $scope._viewFormat;
          var now = new Date();
          var jsDate = new Date(
              viewFormat.indexOf('yyyy') > -1 ? $scope.date.year.replace(/y+/gi, '') : now.getFullYear(),
              viewFormat.indexOf('mm') > -1 ? ($scope.date.month.replace(/m+/gi, '') - 1 || 0) : 0,
              viewFormat.indexOf('dd') > -1 ? ($scope.date.day.replace(/d+/gi, '') || 1) : 1
          );
          if (isRealDate(jsDate) && isWithinDateRange(jsDate)) {
            valid = true;
          }
        }
        return valid;
      };

      /**
       * checks that a date input is the same length as the date view format
       * @date a date string
       */
      var isCompleteDate = function (date) {
        var dateLength = date.replace(/\D+/g, '').length;
        var formatLength = $scope._viewFormat.replace(/[^mdy]+/gi, '').length;
        return dateLength === formatLength;
      };

      var isRealDate = function (date) {
        return (!isNaN(date.getTime()) &&
                (date.getDate() == $scope.date.day ||
                                   !$scope.date.day.replace(/d+/gi, '') ||
                                   $scope._viewFormat.indexOf('dd') < 0) &&
                (date.getMonth() + 1 == $scope.date.month ||
                                        !$scope.date.month.replace(/m+/gi, '') ||
                                        $scope._viewFormat.indexOf('mm') < 0) &&
                date.getFullYear() == $scope.date.year);
      };

      /**
       * Checks whether a date is within the specified range
       * @param String, a date
       * @returns Boolean, whether the date is within the given bounds
       */
      var isWithinDateRange = function (date) {
        var valid = false;
        var now = new Date();

        if ('past' in $attrs) {
          valid = date < now;
        } else if ('future' in $attrs) {
          valid = date >= now;
        } else {
          valid = true;
        }

        if (valid && 'minDate' in $attrs) {
          if (/[mdy]/.test($attrs.minDate)) {
            valid = date >= getRelativeDate($attrs.minDate);
          } else {
            valid = date >= new Date($attrs.minDate);
          }
        }
        if (valid && 'maxDate' in $attrs) {
          if (/[mdy]/.test($attrs.maxDate)) {
            valid = date <= getRelativeDate($attrs.maxDate);
          } else {
            valid = date <= new Date($attrs.maxDate);
          }
        }
        return valid;
      };

      var getRelativeDate = function (relativeDifference) {
        var relativeDate = new Date();
        var number = parseInt(relativeDifference.match(/\d+/)[0]);

        if (relativeDifference.indexOf('-') > -1) {
          number *= -1;
        }
        if (relativeDifference.indexOf('m') > -1) {
          relativeDate.setMonth(relativeDate.getMonth() + number);
        } else if (relativeDifference.indexOf('d') > -1) {
          relativeDate.setDate(relativeDate.getDate() + number);
        } else if (relativeDifference.indexOf('y') > -1) {
          relativeDate.setFullYear(relativeDate.getFullYear() + number);
        }
        return relativeDate;
      };
    },

    link: function (scope, elem, attrs, ngModelCtrl) {

      var viewFormat = attrs.viewFormat || 'mm/dd/yyyy';
      var fieldName = elem.attr('name');
      elem.attr('placeholder', viewFormat.toUpperCase());
      elem.attr('maxlength', viewFormat.length);
      scope.log = [];

      elem.bind('keypress', function handleKeyPress(event) {
        // move the cursor if the user enters a number by slicing next character
        var character = String.fromCharCode(event.which);
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.keypress = character + ' ' + timestamp;
        scope.log.unshift('keypress:  ' + character + ' ' + elem.val() + ' ' + timestamp + '\n\n');
        console.log('keypress:  ' + character + ' ' + elem.val() + ' ' + timestamp);
        
        if (/[0-9]/.test(character)) {
          var input = elem.val();
          var cursorPosition = cursor.getPosition(elem);
          if (input[cursorPosition]) {
            var selection = cursor.getSelection(elem);
            input = input.slice(0, cursorPosition) + character + input.slice(selection.end);

            scope.$evalAsync(function updateViewValue() {
              ngModelCtrl.$pristine = false;
              ngModelCtrl.$setViewValue(input);
              console.log('  keypress async:  ' + input + ' ' + elem.val() + ' ' + timestamp);
              ngModelCtrl.$pristine = true;
            });
          }
        }
      });

      elem.bind('keydown', function handleKeyPress(event) {
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.keydown = String.fromCharCode(event.which) + ' ' + timestamp;
        scope.log.unshift('-');
        scope.log.unshift('keydown:  ' + String.fromCharCode(event.which) + ' ' + elem.val() + ' ' + timestamp);
        console.log('\n\nkeydown:  ' + String.fromCharCode(event.which) + ' ' + elem.val() + ' ' + timestamp);
        if (event.which === 8) {
          // Backspace
          var input = elem.val();
          var cursorPosition = cursor.getPosition(elem);
          if (input[cursorPosition - 1] === '/') {
            cursor.setPosition(elem, --cursorPosition);
          }
        }
      });

      /**
       * registers the parseModel method for the initialization of the scope from the DOM.
       * @param modelValue String, a date string assumed to be in modelFormat
       */
      ngModelCtrl.$formatters.unshift(function initialView(modelValue) {
        var viewValue = modelValue;
        if (!!modelValue) {
          viewValue = scope.parseModel(modelValue);
          ngModelCtrl.$pristine = false;
          ngModelCtrl.$setViewValue(viewValue);
          ngModelCtrl.$pristine = true;
        }
        return viewValue;
      });

      /**
       * parses the date view value (from the input box) into the view format provided.
       * @viewValue a date string
       */
      ngModelCtrl.$parsers.push(function updateView(viewValue) {
        if (viewValue === undefined) {
          viewValue = '';
        }
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.log.unshift('updateView: ' + viewValue + ' ' + timestamp);
        console.log('1. updateView: ' + viewValue + ' ' + timestamp);
        viewValue = scope.formatView(viewValue);
        now = new Date();
        timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        console.log('1. updateView formatted: ' + viewValue + ' ' + timestamp);

        scope.$evalAsync(function updateDom() {
          var now = new Date();
          var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
          scope.log.unshift('updateView async: ' + viewValue + ' ' + timestamp);
          console.log('  1. updateView async: ' + viewValue + ' ' + timestamp);
          elem.val(viewValue);
        });

        return viewValue;
      });

      // Validate the input at every change
      ngModelCtrl.$parsers.push(function inputValidator(viewValue) {
        var valid = scope.isValidDate(viewValue);
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.log.unshift('inputValidator: ' + viewValue + ' ' + timestamp);
        console.log('2. inputValidator: ' + viewValue + ' ' + timestamp);

        // If the user hasn't done anything yet, don't show them a red warning
        if ('required' in attrs && viewValue.length === 0 && ngModelCtrl.$pristine) {
          valid = true;
        }
        ngModelCtrl.$setValidity(fieldName, valid);
        ngModelCtrl.$valid = valid;
        applyErrorClass(valid);
        return viewValue;
      });

      var applyErrorClass = function (valid) {
        if (valid) {
          elem.removeClass('has-error');
        } else {
          elem.addClass('has-error');
        }
      };

      // Parses the date view value (from the input box) into the view format provided.
      ngModelCtrl.$parsers.push(function updateModel(viewValue) {
        var modelValue = viewValue;
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.log.unshift('updateModel: ' + viewValue + ' ' + timestamp);
        console.log('3. updateModel: ' + viewValue + ' ' + timestamp);
        if (ngModelCtrl.$valid) {
          modelValue = scope.formatModel(viewValue);
        } else {
          modelValue = '';
        }
        scope.resetDate();
        return modelValue;
      });

      // Place the cursor before the first placeholder or at the end of the input
      ngModelCtrl.$parsers.push(function updateCursor(modelValue) {
        var now = new Date();
        var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
        scope.log.unshift('updateCursor: ' + modelValue + ' ' + timestamp);
        console.log('4. updateCursor: ' + modelValue + ' ' + timestamp);
        scope.$$postDigest(function () {
          var now = new Date();
          var timestamp = now.getSeconds() + ':' + now.getMilliseconds();
          scope.log.unshift('updateCursor postDigest: ' + modelValue + ' ' + timestamp);
          console.log('  4. updateCursor postDigest: ' + modelValue + ' ' + timestamp);
          var firstPlaceHolder = elem.val().search(/[mdy]/);
          if (firstPlaceHolder >= 0) {
            cursor.setPosition(elem, firstPlaceHolder);
          } else {
            cursor.setPosition(elem, elem.val().length);
          }
        });
        return modelValue;
      });

    }
  };
}]);
