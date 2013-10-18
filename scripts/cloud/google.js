/*------------------------*/
// Namespaces
cloud.gdrive = {};

cloud.gdrive.Auth = (function() {
  var QueryString = {};
  // Creates a oAuth dialog given a set of parameters.
  var oauth = new OAuthWindow(
    elementContainer,
    'https://accounts.google.com/o/oauth2/auth',
    {
      response_type: 'code',
      client_id: 'xxx',
      scope: 'https://www.googleapis.com/auth/drive',
      redirect_uri: 'xxx',
      state: 'foobar',
      access_type: 'offline',
      approval_prompt: 'force'
    }
  );
  oauth.oncomplete = function(evt) {
    if (evt.detail.code) {
      // success
    }
  };
  oauth.onabort = function() {
    // oauth was aborted
  };
  
  function View(options) {
    if (typeof(options) === 'undefined') {
      options = {};
    }

    if (typeof(options) === 'string') {
      this.selectors = { element: options };
    } else {
      var key;

      if (typeof(options) === 'undefined') {
        options = {};
      }

      for (key in options) {
        if (options.hasOwnProperty(key)) {
          this[key] = options[key];
        }
      }
    }

    this.hideErrors = this.hideErrors.bind(this);
  }

  const INVALID_CSS = /([^a-zA-Z\-\_0-9])/g;

  View.ACTIVE = 'active';

  View.prototype = {
    seen: false,
    activeClass: View.ACTIVE,
    errorVisible: false,

    get element() {
      return this._findElement('element');
    },

    get status() {
      return this._findElement('status');
    },

    get errors() {
      return this._findElement('errors');
    }
  }

  QueryString.unescape = function(s, decodeSpaces) {
    return QueryString.unescapeBuffer(s, decodeSpaces).toString();
  };


  QueryString.escape = function(str) {
    return encodeURIComponent(str);
  };

  var stringifyPrimitive = function(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  };


  QueryString.stringify = QueryString.encode = function(obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';
    if (obj === null) {
      obj = undefined;
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).map(function(k) {
        var ks = QueryString.escape(stringifyPrimitive(k)) + eq;
        if (Array.isArray(obj[k])) {
          return obj[k].map(function(v) {
            return ks + QueryString.escape(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + QueryString.escape(stringifyPrimitive(obj[k]));
        }
      }).join(sep);

    }

    if (!name) return '';
    return QueryString.escape(stringifyPrimitive(name)) + eq +
           QueryString.escape(stringifyPrimitive(obj));
  };

  // Parse a key=val string.
  QueryString.parse = QueryString.decode = function(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};

    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }

    var regexp = /\+/g;
    qs = qs.split(sep);

    var maxKeys = 1000;
    if (options && typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }

    var len = qs.length;
    // maxKeys <= 0 means that we should not limit keys count
    if (maxKeys > 0 && len > maxKeys) {
      len = maxKeys;
    }

    for (var i = 0; i < len; ++i) {
      var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;

      if (idx >= 0) {
        kstr = x.substr(0, idx);
        vstr = x.substr(idx + 1);
      } else {
        kstr = x;
        vstr = '';
      }

      try {
        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);
      } catch (e) {
        k = QueryString.unescape(kstr, true);
        v = QueryString.unescape(vstr, true);
      }

      if (!hasOwnProperty(obj, k)) {
        obj[k] = v;
      } else if (Array.isArray(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    }

    return obj;
  };

  return QueryString;

  function OAuthWindow(container, server, params) {
    if (!params.redirect_uri) {
      throw new Error(
        'must provide params.redirect_uri so oauth flow can complete'
      );
    }

    this.params = {};
    for (var key in params) {
      this.params[key] = params[key];
    }

    this._element = container;

    firetext.View.call(this);
    this.target = server + '?' + firetext.QueryString.stringify(params);

    this._handleUserTriggeredClose =
      this._handleUserTriggeredClose.bind(this);
  }

  OAuthWindow.prototype = {
    __proto__: firetext.View.prototype,

    get element() {
      return this._element;
    },

    get isOpen() {
      return !!this.browserFrame;
    },

    selectors: {
      browserTitle: 'header > h1',
      browerCancelButton: 'button.cancel',
      browserContainer: '.browser-container'
    },

    get browserContainer() {
      return this._findElement('browserContainer', this.element);
    },

    get browserTitle() {
      return this._findElement('browserTitle', this.element);
    },

    get browerCancelButton() {
      return this._findElement('browerCancelButton', this.element);
    },

    _handleFinalRedirect: function(url) {
      this.close();

      if (this.oncomplete) {
        var params;

        // find query string
        var queryStringIdx = url.indexOf('?');
        if (queryStringIdx !== -1) {
          params = firetext.QueryString.parse(url.slice(queryStringIdx + 1));
        }

        this.oncomplete(params || {});
      }
    },

    _handleLocationChange: function(url) {
      this.browserTitle.textContent = url;
    },

    _handleUserTriggeredClose: function() {
      // close the oauth flow
      this.close();

      // trigger an event so others can cleanup
      this.onabort && this.onabort();
    },

    handleEvent: function(event) {
      switch (event.type) {
        case 'mozbrowserlocationchange':
          var url = event.detail;
          if (url.indexOf(this.params.redirect_uri) === 0) {
            return this._handleFinalRedirect(url);
          }
          this._handleLocationChange(url);
          break;
      }
    },

    open: function() {
      if (this.browserFrame) {
        throw new Error('attempting to open frame while another is open');
      }

      // add the active class
      this.element.classList.add(firetext.View.ACTIVE);

      // handle cancel events
      this.browerCancelButton.addEventListener(
        'click', this._handleUserTriggeredClose
      );

      // setup browser iframe
      var iframe = this.browserFrame =
        document.createElement('iframe');

      iframe.setAttribute('mozbrowser', true);
      iframe.setAttribute('src', this.target);

      this.browserContainer.appendChild(iframe);

      iframe.addEventListener('mozbrowserlocationchange', this);
    },

    close: function() {
      if (!this.isOpen)
        return;

      this.browserFrame.removeEventListener(
        'mozbrowserlocationchange', this
      );

      this.browerCancelButton.removeEventListener(
        'click', this._handleUserTriggeredClose
      );

      this.element.classList.remove(firetext.View.ACTIVE);

      this.browserFrame.parentNode.removeChild(
        this.browserFrame
      );

      this.browserFrame = undefined;
    }
  };

  return OAuthWindow;
}());