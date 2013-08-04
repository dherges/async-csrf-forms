/*
 * async-csrf-forms
 * https://github.com/dherges/async-csrf-forms
 *
 * Copyright (c) 2013 David Herges
 * Licensed under the MIT, Apache-2.0 licenses.
 */

/**
 * quick'n'dirty proof-of-concept server implementation.
 * written as connect middleware.
 *
 */

var parse = require('url').parse;

exports = module.exports = function (options) {
  var options = options || {}

  /** token generator */
  function token (req, res, next) {
    var pool = '0123456789abcdef'
      , token = ''

    if (req.query.static) {
      token = req.query.static
    } else {
      for (var i = 0; i < 5; i++) {
        token += pool.charAt(Math.floor(Math.random() * pool.length));
      }
    }

    res.statusCode = 200;
    res.setHeader('X-CSRF-Token', token);

    return res.end();
  }

  /** form submit action */
  function action (req, res, next) {
    var cookieToken = req.cookies['x-csrf-token']
      , fieldToken = req.body['x-csrf-token']
      , success = (cookieToken && fieldToken && cookieToken === fieldToken)
      , body = '<p>' + (success ? '201' : '403')
          + ' - your form submittal was ' + (success ? 'allowed' : 'forbidden')
          + '<p>field: ' + fieldToken + ', cookie: ' + cookieToken

    res.statusCode = success ? 201 : 403;

    return res.end(body);
  }

  /** token generator */
  return function (req, res, next) {
    var parsedUrl = parse(req.url).pathname;
    if (parsedUrl === '/poc/token') {
      return token(req, res, next);
    } else if (parsedUrl === '/poc/action') {
      return action(req, res, next);
    }

    return next();
  }
};
