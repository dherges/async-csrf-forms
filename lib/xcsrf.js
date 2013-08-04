/*
 * async-csrf-forms
 * https://github.com/dherges/async-csrf-forms
 *
 * Copyright (c) 2013 David Herges
 * Licensed under the MIT, Apache-2.0 licenses.
 */
!(function (context, undefined) {

   /*
    * context detection and glue-ing code to javascript libraries.
    *
    * NOTICE: I've finally succeeded in getting 'bonzo' and 'qwery' in
    * require()-like style out of jQuery's $-pollution, yet it's absolutely
    * impossible to isolate 'bean'.
    * var bonzo = $, qwery = $, cookie = $.cookie
    */
  var $ = context['ender'] || context['jQuery'] || undefined
    , ajax = (context['ender'] && require) ? require('reqwest').compat : $.ajax

  if ($ === undefined) {
    throw '$ is undefined. xcsrf depends on either ender or jQuery.'
  }


  /*
   * And here we go... :-)
   */

  /**
   * Default options for the xcsrf module. These are:
   * 'url': to AJAX endpoint for token delivery
   * 'header': the HTTP header from where tokens are read on delivery
   * 'cookie': the cookie key where tokens are stored
   * 'field': the form field name where tokens are stored
   */
  var defaults = {
    url: ''
  , header: 'x-csrf-token'
  , cookie: 'x-csrf-token'
  , field: 'x-csrf-token'
  };

  /**
   * Generates a new xcsrf instance on node with options
   * @param {Element} node DOM node/element
   * @param {Object} options Key-value options
   */
  var xcsrf = function (node, options) {
    this.init(node, options);
  };

  /**
   * Initializes this xcsrf instance.
   * @param {Element} node DOM node/element
   * @param {Object} options Key-value options
   */
  xcsrf.prototype.init = function (node, options) {
    this.$node = $(node);
    this.options = {};
    this.options.url       = (options && options.url)       || (this.$node.attr('data-x-csrf-url'))       || defaults.url;
    this.options.cookie    = (options && options.cookie)    || (this.$node.attr('data-x-csrf-cookie'))    || defaults.cookie;
    this.options.field     = (options && options.field)     || (this.$node.attr('data-x-csrf-field'))     || defaults.field;
    this.options.header    = (options && options.header)    || (this.$node.attr('data-x-csrf-header'))    || defaults.header;

    // TODO: v0.2.0 - intention pairing
    this.options.intention = undefined; // (options && options.intention) || (this.$node.attr('data-x-csrf-intention')) || (this.$node.attr('id')) || defaults.intention;

    // with javascript cookies, we can skip ajax'ing a new token
    var token = this.readCookie(this.options.intention);
    if (this.options.cookie && token) {
      this.appendField(token);
    } else {
      this.listen();
    }

    // store this instance on the node
    this.$node.data('xcsrf', this);
  };

  /**
   * Read a token value from cookie <code>this.options.cookie</code>.
   * @param {String} intention Token for intention; optional
   * @return {String} Token value
   */
  xcsrf.prototype.readCookie = function (intention) {
    var opts = intention ? undefined : {raw: true}
      , obj = $.cookie(this.options.cookie, null, opts)

    return obj ? obj[intention] : obj;
  };

  /**
   * Store a token value in cookie <code>this.options.cookie</code>.
   * @param {String} token Token value
   * @param {String} intention Token for intention; optional
   */
  xcsrf.prototype.storeCookie = function (token, intention) {
    var cookieObj = token
      , opts = {path: '/'}

    if (intention) {
      cookieObj = {};
      cookieObj[intention] = '' + token;
      $.cookie.json = true;
    } else {
      opts.raw = true;
    }

    $.cookie(this.options.cookie, cookieObj, opts);
  };

  /**
   * Listens for DOM events on this's node, then AJAX'es to the token delivery URL.
   */
  xcsrf.prototype.listen = function () {

    var that = this;
    this.$node.one('focusin submit', function (evt) {
      evt.preventDefault();
      // jQuery event listener fires twice (for focusin and submit) -- prevent that from happening
      that.unlisten();

      that.requestToken(function (token) {
        that.onTokenReceived(token);

        // resume original 'submit' event
        if (evt && evt.type === 'submit') {
          that.submitForm();
        }
      });
    });
  };

  /**
   * Stops listening for DOM events on this's node.
   */
  xcsrf.prototype.unlisten = function () {
    this.$node.off('focusin submit');
  };

  /**
   * AJAX'es to the token delivery URL. Reads the token from the response and
   * invokes the success callback.
   * @param {Function} success Callback to handle the token, <code>function (token)</code>
   */
  xcsrf.prototype.requestToken = function (success) {

    var that = this;
    ajax({
      url: this.options.url
    , xhrFields: {
        withCredentials: true
      }
    , success: function (data, status, xhr) {
        // jQuery passes xhr as third argument, reqwest as first argument
        if (data && data.getResponseHeader) {
          xhr = data;
        }

        if (success) {
          success(xhr.getResponseHeader(that.options.header));
        }
      }
    });
  };

  /**
   * Called after a token was successfully delivered. Stores the token as cookie,
   * and appends it as hidden field.
   * @param {String} token Token value
   */
  xcsrf.prototype.onTokenReceived = function (token) {
    // store cookie if option is enabled
    if (this.options.cookie && this.options.cookie !== 'false') {
      this.storeCookie(token, this.options.intention);
    }
    // append the hidden field
    this.appendField(token);
  };

  /**
   * Appends the hidden field.
   * @param {String} token Token value
   */
  xcsrf.prototype.appendField = function (token) {
    this.$node.append('<input type="hidden" name="' + this.options.field + '" value="' + token + '">');
  };

  xcsrf.prototype.submitForm = function () {
    var that = this;
    window.setTimeout(function () {
      that.$node.get(0).submit();
    }, 200);
  };


  // publish ourselves :-)
  if (context['ender'] && provide) {
    provide('xcsrf', xcsrf);
  } else if (context['jQuery']) {
    // boilerplated $paghetti code...ui ui ui
    context['jQuery'].fn['xcsrf'] = function (opts) {
      return this.each(function () {
        new xcsrf(this, opts);
      });
    };
  }

}(this));
