demoApp.service('cursor', function() {

  this.getPosition = function(elem) {
    var position = 0,
    selection;
    var element = elem[0];
    if (document.selection) {
      // IE Support
      element.focus();
      selection = document.selection.createRange();
      selection.moveStart ('character', -element.value.length);
      position = selection.text.length;
    } else if (element.selectionStart || element.selectionStart === 0) {
      position = element.selectionStart;
    }
    return position;
  };

  this.setPosition = function(elem, position) {
    var selection;
    var element = elem[0];
    if (document.selection) {
      // IE Support
      selection = document.selection.createRange();
      selection.moveStart ('character', -element.value.length);
      selection.moveStart ('character', position);
      selection.moveEnd ('character', position);
      selection.select ();
    } else if (element.selectionStart || element.selectionStart === 0) {
      element.selectionStart = position;
      element.selectionEnd = position;
    }
  };

  this.getSelection = function(elem) {
    // http://stackoverflow.com/a/4207763/1248811
    var start = 0, end = 0, normalizedValue, range,
    textInputRange, len, endRange;
    var element = elem[0];

    if (element.selectionStart || element.selectionStart === 0) {
      start = element.selectionStart;
      end = element.selectionEnd;
    } else {
      range = document.selection.createRange();

      if (range && range.parentElement() == element) {
        len = element.value.length;
        normalizedValue = element.value.replace(/\r\n/g, "\n");

        // Create a working TextRange that lives only in the input
        textInputRange = element.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());

        // Check if the start and end of the selection are at the very end
        // of the input, since moveStart/moveEnd doesn't return what we want
        // in those cases
        endRange = element.createTextRange();
        endRange.collapse(false);

        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
          start = end = len;
        } else {
          start = -textInputRange.moveStart("character", -len);
          start += normalizedValue.slice(0, start).split("\n").length - 1;

          if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
            end = len;
          } else {
            end = -textInputRange.moveEnd("character", -len);
            end += normalizedValue.slice(0, end).split("\n").length - 1;
          }
        }
      }
    }

    return {
      start: start,
      end: end
    };
  };

  this.nextNumberPosition = function(elem, position) {
    if (!position) {
      position = 0;
    }
    var steps = elem.val().slice(position).search(/\d/);
    if (steps === -1) {
      return position;
    }
    return position + steps;
  };

  this.previousNumberPosition = function(elem, position) {
    if (position === undefined || position < 0) {
      position = elem.val().length;
    }
    var reverseLeftSide = elem.val().slice(0, position).split('').reverse().join('');
    var steps = reverseLeftSide.search(/\d/);
    if (steps === -1) {
      return 0;
    }
    position -= steps;
    if (position < 0) {
      position = 0;
    }
    return position;
  };

});
