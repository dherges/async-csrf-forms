async-csrf-forms
================

[![Build Status](https://travis-ci.org/dherges/async-csrf-forms.png?branch=master)](https://travis-ci.org/dherges/async-csrf-forms)

> Utile client-side javascript to inject CSRF tokens into forms asynchronously.

Benefits:

 1. Tokens are delivered through AJAX, thus form delivery is cacheable
 2. Double-submitted cookie pattern works without server-side storage


## What the heck?

Very good question, indeed. Let's explain.

Cross-Site Request Forgery (CSRF, also XSRF or Sesssion Riding) is some type of web security vulnerability. To protect against CSRF attacks, most web applications resort on [token-based solutions][owasp]. They generate a random, unique token on a per-session basis; sometimes also on a per-session per-form  basis. The token is then set as a ```<input type="hidden">``` in the HTML markup and evaluated when the user submits the form. If the token being submitted in the form matches the random token that was generated on the server, the user action is allowed to continue.

Ok, everyone's doing that. Where's the problem then? The token is random. The token is stored on the server. Random on server-side is stateful-ness (ough...).

Example: a form is delivered through ```GET /my/form``` and your HTML template on the server looks something like:

```html
<form>
  <input type="hidden" name="x-csrf-token" value="{{token}}">
  <input type="submit" value="Submit">
</form>
```

Here, the ```GET /my/form``` request delivers the token, thus the request won't be cacheable (and there are good reasons to live with that restriction). Just if your performance degrades _'too much'_, you may want to cache ```GET``` requests that deliver forms, which – in turn – means that **you do not want to deliver tokens on form delivery**.

Same goes for token storage: if your server-side/backend storage is impacting on performance, you may want to reduce read/write access to storage and **try to not store CSRF tokens on server-side**.


## A better solution?

Well, defintely maybe.

We will still deliver the token through a non-cacheable HTTP request. I don't know a way to get around this.

However, instead of delivering the token when the form is rendered, we'll bind to a DOM event on a 'plain' form. When the form receives a ```focusin``` or a ```submit``` event (e.g. user clicks a checkbox, starts typing in an input field), an AJAX request is triggered in the background. The response should return a header named ```x-csrf-token```. Through some javascript hacking, the header value is read from the response, set as a cookie in the browser, and appended as a hidden field to the form.

On form submittal, the browser will a) include the cookie in the HTTP request headers, b) append the hidden field in form data. On server-side, you need to compare the cookie value with the hidden form field and, if both tokens do match, perform some magic of your application. If the tokens do not mach, you'll better stop.

### Security Advisory

**NOTE**: The library does *NOT* offer a solution to securely handle tokens on server-side. It will not generate nor match tokens. Just hacking this piece of javascript into your application, won't protect anyone against anything (yet, it [increases entropy][entropy]).

Please have a close look at the licensing, too. The licenses *DO NOT* include any kind of warranty or whatsoever.

### Configuration Options

The following options are available and customize the behaviour of the library:

- ```url```: the AJAX endpoint that gets called to retrieve the token,
- ```header```: the HTTP response header that includes the generated token; default: ```x-csrf-token```,
- ```field```: the form field name where the token should be placed; default: ```x-csrf-token```,
- ```cookie```: optional; cookie name where the token is stored; if blank, the cookie is not set in javascript code; leaving the option blank is useful when you set the cookie through a ```Set-Cookie``` HTTP response header, or when you do not need a cookie at all (server-side token storage),

### The Double-Submitted Cookie Pattern

Submitting CSRF tokens in both cookie and hidden field, is a technique called "double-submitted cookies". The reason why it helps against CSRF attacks, is that a cross-site origin is able to write cookies in a HTTP request, but it is unable to read cookies.

Double-submitted cookies, however, require that the request origin is able to read the cookie and then include the token in another place of the request (e.g. hidden field).

If you do not wish to use the pattern, disable the  ```cookie``` option. You will still need a server-side token storage.

### Downsides of this approach

Q: JavaScript must be enabled in the browser.<br>
A: Yes.

Q: What if, the request handling for tokens is messed up?<br>
A: Game over. See advisory above. Your application needs a secure way to generate, deliver, and match tokens. There are frameworks that take over this job. This library will not!

Q: What if, the token delivery fails?<br>
A: Yes, there will be no hidden field on the form. That will prevent your user from doing the action that she/he wants to do.

### Upsides of this approach

Q: Do I need to store CSRF tokens on the server?<br>
A: No. Comparing cookie with hidden field is enough. However, if not using the double-submitted cookie pattern, you still need server-side token storage (see above).

Q: Am I able to cache HTTP requests that deliver forms?<br>
A: Done right, yes, you will be.

Q: Can I use the library with jQuery?<br>
A: Yes. I've been building on Ender modules that should be compatible with that monolithic jBeast.

Q: What if, in addition the forms, I want to protect my AJAX calls by CSRF tokens as well?<br>
A: Roughly speaking, you could try something like

```javascript
$(document).ready(function () {
  // set your options, call the token generator
  var options = {...};
  var xcsrf = new xcsrf('body', options);
  xcsrf.trigger('focusin');
});
$.ajax(
  before: function() {
	// read the token from cookie storage, then set it in an 'X-CSRF-Token' header
	xhr.setHeader(xcsrf.options.header, xcsrf.readCookie());
  }
)
```


## Demo / User Guide

See files in the ```demo``` directory. The ```xcsrf``` javascript code is built to integrate with both jQuery and Ender (with or without ```$.ender``` client API).

In Ender, we are dependent on the following packages: [```bean```][bean], [```bonzo```][bonzo], [```jar```][jar], [```reqwest```][reqwest], [```qwery```][qwery].

```shell
ender info --use demo/ender.js
ender build bean bonzo jar reqwest qwery --output demo/ender.js
```


## LICENSE

Copyright (c) 2013 David Herges.<br>
Dual-licensed under MIT and Apache 2.0 licenses.

Feel free to contribute. Feedback welcome. Thank you for attribution!



[owasp]: https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)_Prevention_Cheat_Sheet#General_Recommendation:_Synchronizer_Token_Pattern "OWASP CRSF Prevention Cheat Sheet"
[entropy]: http://thinkrelevance.com/blog/2013/05/21/entropy-and-evolution-of-a-codebase "Entropy and Evolution of a Codebase"
[bonzo]: https://github.com/ded/bonzo "A library agnostic extensible DOM utility. Nothing else."
[bean]: https://github.com/fat/bean "Bean is a small, fast, cross-platform, framework-agnostic event manager."
[jar]: https://github.com/amccollum/jar "Simple cookie handling."
[reqwest]: https://github.com/ded/reqwest "It's AJAX. All over again."
[qwery]: https://github.com/ded/qwery "Qwery is a small blazing fast query selector engine allowing you to select elements with CSS1|2|3 queries."
