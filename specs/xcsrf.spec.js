(function (context, undefined) {
  'use strict';

  // specs are shared on jQuery and ender, thus resolve context
  var $ = (context.ender || context.jQuery);


  describe('xcsrf', function () {

    it('is exposed through $().xcsrf', function () {
      var $form = $('<form></form>');
      expect($form.xcsrf).toBeDefined();
      expect(typeof $form.xcsrf).toEqual('function');
      $form.detach();
    });

    it('stores its instance on the node', function () {
      var $form = $('<form></form>').xcsrf();
      expect($form.data('xcsrf')).toBeDefined();
      expect(typeof $form.data('xcsrf')).toEqual('object');
      $form.detach();
    });

    it('has $node and options', function () {
      var $form = $('<form></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');
      expect(xcsrf.$node).toBeDefined();
      expect(typeof xcsrf.options).toEqual('object');
      $form.detach();
    });

    it('sets default options', function () {
      var $form = $('<form></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');
      expect(xcsrf.options.url).toEqual('');
      expect(xcsrf.options.cookie).toEqual('x-csrf-token');
      expect(xcsrf.options.field).toEqual('x-csrf-token');
      expect(xcsrf.options.header).toEqual('x-csrf-token');
      $form.detach();
    });

    it('sets options through javascript API', function () {
      var $form = $('<form></form>').xcsrf({url: 'url/test', cookie: 'cookieval', field: 'fieldval', header: 'headerval'}),
          xcsrf = $form.data('xcsrf');
      expect(xcsrf.options.url).toEqual('url/test');
      expect(xcsrf.options.cookie).toEqual('cookieval');
      expect(xcsrf.options.field).toEqual('fieldval');
      expect(xcsrf.options.header).toEqual('headerval');
      $form.detach();
    });

    it('sets options through data-* API', function () {
      var $form = $('<form data-x-csrf-url="url/test" data-x-csrf-cookie="cookieval" data-x-csrf-field="fieldval" data-x-csrf-header="headerval"></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');
      expect(xcsrf.options.url).toEqual('url/test');
      expect(xcsrf.options.cookie).toEqual('cookieval');
      expect(xcsrf.options.field).toEqual('fieldval');
      expect(xcsrf.options.header).toEqual('headerval');
      $form.detach();
    });

    it('requests the CRSF token from delivery URL', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf'),
          success = jasmine.createSpy('success');

      runs(function () {
        xcsrf.requestToken(success);
      });

      waitsFor(function () {
        return success.wasCalled;
      }, 'The sucess spy should have been called', 1000);

      runs(function () {
        expect(success).toHaveBeenCalledWith('a0b0c0');
        $form.detach();
      });
    });

    it('appends the CRSF token in a hidden field', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      xcsrf.onTokenReceived('ff00ff');
      expect($form.find('input[name="x-csrf-token"]').length).toBeGreaterThan(0);
      expect($form.find('input[name="x-csrf-token"]').attr('value')).toEqual('ff00ff');
      $form.detach();
    });

    it('appends the CRSF token in a custom hidden field', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0" data-x-csrf-field="custom"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      xcsrf.onTokenReceived('ff00ff');
      expect($form.find('input[name="custom"]').length).toBeGreaterThan(0);
      expect($form.find('input[name="custom"]').attr('value')).toEqual('ff00ff');
      $form.detach();
    });

    it('stores the CRSF token in a cookie', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      spyOn($, 'cookie');
      xcsrf.onTokenReceived('aa00ee');
      expect($.cookie).toHaveBeenCalledWith('x-csrf-token', 'aa00ee', {path: '/', raw: true});
      $form.detach();
    });

    it('stores the CRSF token in a custom cookie', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0" data-x-csrf-cookie="custom"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      spyOn($, 'cookie');
      xcsrf.onTokenReceived('aa00ee');
      expect($.cookie).toHaveBeenCalledWith('custom', 'aa00ee', {path: '/', raw: true});
      $form.detach();
    });

    it('does not store the CRSF token in a cookie, when cookie option is false', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0" data-x-csrf-cookie="false"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      spyOn($, 'cookie');
      xcsrf.onTokenReceived('aa00ee');
      expect($.cookie).not.toHaveBeenCalled();
      $form.detach();
    });

    it('is triggered by focusin, doing all the magic', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      spyOn(xcsrf, 'requestToken').andCallThrough();
      spyOn(xcsrf, 'onTokenReceived').andCallThrough();

      runs(function () {
        $form.trigger('focusin');
      });

      waitsFor(function () {
        return $form.find('input[type="hidden"]').length > 0;
      }, 'The hidden field should have been appended', 1000);

      runs(function () {
        expect($form.find('input[name="x-csrf-token"]').length).toBeGreaterThan(0);
        expect($form.find('input[name="x-csrf-token"]').attr('value')).toEqual('a0b0c0');
        expect(xcsrf.requestToken).toHaveBeenCalled();
        expect(xcsrf.onTokenReceived).toHaveBeenCalled();
        $form.detach();
      });
    });

    it('is triggered by submit, doing all the magic', function () {
      var $form = $('<form data-x-csrf-url="/poc/token?static=a0b0c0"><input type="text" name="myname" value="" /></form>').xcsrf(),
          xcsrf = $form.data('xcsrf');

      spyOn(xcsrf, 'requestToken').andCallThrough();
      spyOn(xcsrf, 'onTokenReceived').andCallThrough();
      spyOn(xcsrf, 'submitForm');

      runs(function () {
        $form.trigger('submit');
      });

      waitsFor(function () {
        return $form.find('input[type="hidden"]').length > 0;
      }, 'The hidden field should have been appended', 1000);

      runs(function () {
        expect($form.find('input[name="x-csrf-token"]').length).toBeGreaterThan(0);
        expect($form.find('input[name="x-csrf-token"]').attr('value')).toEqual('a0b0c0');
        expect(xcsrf.requestToken).toHaveBeenCalled();
        expect(xcsrf.onTokenReceived).toHaveBeenCalled();
        expect(xcsrf.submitForm).toHaveBeenCalled();
        $form.detach();
      });
    });

  });

})(this);
