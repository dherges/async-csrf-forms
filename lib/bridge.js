/*!
 * async-csrf-forms
 * https://github.com/dherges/async-csrf-forms
 *
 * Copyright (c) 2013 David Herges
 * Licensed under the MIT, Apache-2.0 licenses.
 */
!(function ($) {

  // get ourselves a reference to the constructor
  var xcsrf = require('xcsrf');

  // $.xcsrf() integration for ender
  $.ender({
    xcsrf: function (opts) {
      return this.forEach(function (el) {
        new xcsrf(el, opts);
      });
    }
  }, true);

}(ender));
