/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 roTuKa
 *  (c) 2008, gzigzigzi (caching)
 *--------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------*

    // Send parameters x-domain
    new Ajax.Request('http://example.com/', {
        parameters: {some: 1, another: 2}
    });
    
    // Send form #SomeForm x-domain
    new Ajax.Request('http://example.com/', {
        form: $('SomeForm')
    });
    
    // Send form #SomeForm with IframeRequest
    new Ajax.Request(null, {
        form: $('SomeForm')
    });
    
    // another way
    
    $('SomeForm').submitThroughIframe();
*---------------------------------------------------------------------------*/

$ns('Backend.Ajax');

Backend.Ajax = {
    iframeRequests: {},
    cache: $H(),
    reqCount: 0,
    getXmlHttpRequest: Ajax.getTransport,
    /**
     * Returns XmlHttpRequest or IframeRequest
     */
    getTransport: function(transport) {
        transport = transport || 'xhr';
        if ('xhr' == transport.toLowerCase()) {
            return Backend.Ajax.getXmlHttpRequest();
        } else if ('iframe' == transport.toLowerCase()) {
            return new Backend.Ajax.IframeRequest();
        }
    },

    /**
     * Creates iframe for IframeRequest
     */
    createIframe: function(id) {
        var self = this;
        var divElm = document.createElement('DIV');
        Object.extend(divElm.style, {
            position: 'absolute', top: 0, marginLeft: '-10000px'
        });
        if (navigator.userAgent.indexOf('MSIE') > 0 && navigator.userAgent.indexOf('Opera') == -1) {// switch to the crappy solution for IE
            divElm.innerHTML = '<iframe name=\"frame_' + id + '\" id=\"frame_' + id + '\" src=\"about:blank\" onload=\"setTimeout(function(){Backend.Ajax.iframeRequests[' + id + ']._onload()},20);"></iframe>';
        } else {
            var frame = document.createElement("iframe");
            frame.setAttribute('name', 'frame_' + id);
            frame.setAttribute('id', 'frame_' + id);
            frame.addEventListener('load', function(){Backend.Ajax.iframeRequests[id ]._onload();}, false);
            divElm.appendChild(frame);
        }
        document.getElementsByTagName("body").item(0).appendChild(divElm);

        var frame = $('frame_' + id);
        frame.observe('load', function(){Backend.Ajax.iframeRequests[id ]._onload();});
        return frame;
    }
};

Ajax.getTransport = Backend.Ajax.getTransport; // Replace Prototype's Ajax.getTransport()
Backend.Ajax.IframeRequest = Class.create({
    initialize: function() {
        this.responseText = null;
        this.responseXML = null;
        this.status = null;
        this.statusText = null;
        this.readyState = 0;

        Backend.Ajax.reqCount++;
        this._method = null;
        this._uri = null;
        this._bodyData = null;
        this._req_id = Backend.Ajax.reqCount;
        this._requestHeaders = {};
        Backend.Ajax.iframeRequests[this._req_id] = this;
    },
    
    onreadystatechange: function() {},
    
    setState: function(state) {
        this.readyState = state;
        this.onreadystatechange();
    },
    /**
     * Available methods: get, post, form
     */
    open: function(/*String*/method, /*String*/uri, async, userName, password) {
        this._method = method.toUpperCase();
        this._uri = uri;

        this.setState(1);
    },

    setRequestHeader: function(/*String*/header, /*String*/value){
        this._requestHeaders[header] = value;
    },

    send: function(content) {
        this._bodyData = content;

        this._frame = Backend.Ajax.createIframe(this._req_id);

        if ('FORM' == this._method) {
            return this._sendViaForm();
        } else // GET, POST

        if ('GET' == this._method) {
            this._uri = this._uri + "&" + this._bodyData;
        }

        try {
            this._frame.src = this._uri;   
        } catch(e) {
            return false;
        }
    },

    _sendViaForm: function() {
        form = $(this._bodyData);
        form.target = 'frame_' + this._req_id;
        form.setAttribute('target', 'frame_' + this._req_id); // in case the other one fails.
        form.submit();
    },

    _onload: function() {
        try {   var doc = this._frame.contentDocument.body.innerHTML; this._frame.contentDocument.close(); }  // 
        catch (e){ 
            try {   var doc = this._frame.contentDocument.document.body.innerHTML; this._frame.contentDocument.document.close(); }  // For NS6
            catch (e){ 
                try{ var doc = this._frame.contentWindow.document.body.innerHTML; this._frame.contentWindow.document.close(); } // For IE5.5 and IE6
                 catch (e){
                     try { var doc = this._frame.document.body.innerHTML; this._frame.document.body.close(); } // for IE5
                        catch (e) {
                            try { var doc = window.frames['frame_'+this.uniqueId].document.body.innerText; } // for really nasty browsers
                            catch (e) { } // forget it.
                     }
                }
            }
        }
        this.responseText = doc;

        this.status = 200;
        this.setState(4);
    }
});

Backend.Ajax.Request = Class.create(Ajax.Request, {
    initialize: function($super, url, options) {
        this.options = {
            method:       'post',
            transport:    'xhr',
            asynchronous: true,
            contentType:  'application/x-www-form-urlencoded',
            encoding:     'UTF-8',
            parameters:   '',
            evalJSON:     true,
            evalJS:       true,
            cache:        false
        };
        Object.extend(this.options, options || {});

        this.options.method = this.options.method.toLowerCase();
        if (Object.isString(this.options.parameters))
          this.options.parameters = this.options.parameters.toQueryParams();

        if (this.options.form) {
            this.options.transport = 'iframe';
            this.form = $(this.options.form);
            this.options.method = 'form';
            if (null == url) {
                url = this.form.action;
            }
        }
        
        if (/^http/.test(url)) {
            this.options.transport = 'iframe';
        }
        this.transport = Backend.Ajax.getTransport(this.options.transport);

        this.request(url);
    },

    request: function(url) {
        this.url = url;
        this.method = this.options.method;
        var params = Object.clone(this.options.parameters);

        if (!['get', 'post', 'form'].include(this.method)) {
            // simulate other verbs over post
            params['_method'] = this.method;
            this.method = 'post';
        }

        this.parameters = params;

        if (params = Object.toQueryString(params)) {
            // when GET, append parameters to URL
            if (this.method == 'get')
                this.url += (this.url.include('?') ? '&' : '?') + params;
            else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
                params += '&_=';
        }

        try {
            var response = new Ajax.Response(this);
            if (this.options.onCreate) this.options.onCreate(response);
            Ajax.Responders.dispatch('onCreate', this, response);

            this.transport.open(this.method.toUpperCase(), this.url,
                this.options.asynchronous);

            if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();

            if (this.method == 'form') {
                this.body = this.form;
            } else if (this.method == 'post') {
                this.body = this.options.postBody || params;
            } else {
                this.body = null;
            }
           
            if (!this.options.cache) {
                this.transport.send(this.body);
            } else {
                if (this._isCached(this)) {
                    this.transport = this._getCached(this);
                    this.onStateChange();
                } else {
                    this.transport.send(this.body);
                }
            }

            /* Force Firefox to handle ready state 4 for synchronous requests */
            if (!this.options.asynchronous && this.transport.overrideMimeType)
                this.onStateChange();

        }
        catch (e) {
            this.dispatchException(e);
        }
    },

    _getCacheKey: function(request) {
        // I should implement more optimal alghoritm.
        return request.url + Object.toJSON(request.parameters);
    },

    _cache: function(response) {
        var cacheKey = this._getCacheKey(response.request);
        Backend.Ajax.cache.set(cacheKey, response);
    },

    _isCached: function(request) {
        var cacheKey = this._getCacheKey(request);
        return Backend.Ajax.cache.keys().member(cacheKey);
    },

    _getCached: function(request) {
        var cacheKey = this._getCacheKey(request);
        return Backend.Ajax.cache.get(cacheKey);
    },

    respondToReadyState: function($super, readyState) {
        $super(readyState);
        if (this.options.cache) {
            var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);
            if (state == 'Complete') {
                this._cache(response);
            }
        }
    }
});

$AJAX = function(url, options) { return new Backend.Ajax.Request(url, options); };

//Backend.Ajax._Request = Ajax.Request;
//Ajax.Request.prototype.initialize = Backend.Ajax.Request.prototype.initialize;
//Ajax.Request.prototype.request = Backend.Ajax.Request.prototype.request;

Backend.Prototype = Backend.Prototype || {};
Backend.Prototype.Form = Backend.Prototype.Form || {}
Backend.Prototype.Form.submitThroughIframe = function($form, options) {
    defaultOptions = {
        form: $form
    };
    Object.extend(defaultOptions, options);
    return new Ajax.Request(null, defaultOptions);
}

Element.addMethods("FORM", {
    submitThroughIframe: Backend.Prototype.Form.submitThroughIframe
});

Element.addMethods({
    load: function(element, url, options) {
        element = $(element);
        options = options || {};
        options._onComplete = options.onComplete || Prototype.emptyFunction;
        options.onSuccess = function(transport, json) {
            element.update(transport.responseText);
            options._onComplete(transport, json);
        }
        new Ajax.Request(url, options);
        return element;
    }
});
