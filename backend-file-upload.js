Bakend.Ajax = {};
Bakend.Ajax.IframeRequest = Class.create({
    initialize: function() {
        this.responseText = null;
        this.responseXML = null;
        this.status = null;
        this.statusText = null;
        this.readyState = 0;

        Bakend.Ajax.IframeRequest.reqCount++;

        this._requestHeaders = {};
        this._allResponseHeaders = null;
        this._responseHeaders = {};
        this._method = null;
        this._uri = null;
        this._bodyData = null;
        this._req_id = Bakend.Ajax.IframeRequest.reqCount;
    },
  
    open: function(method, url, async) {
        this._method = method;
        this._uri = uri;

        this.readyState = 1;
    },

    setRequestHeader: function(/*String*/header, /*String*/value){
        this._requestHeaders[header] = value;
    },

    onreadystatechange: Prototype.emptyFunction,

    send: function(/*String*/stringData) {
        var self = this;    
        if(this.protocol.toUpperCase()=='POST') {
            this.url = this.url + "&" + stringData;
        }
        var IFrameDoc = document.createElement('iframe');
        IFrameDoc.setAttribute('id', 'req'+this._req_id);
        IFrameDoc.setAttribute('name', 'req'+this._req_id);
        Object.extend(IFrameDoc.style, {
            width: 0, height: 0, border: 0, margin: 0, padding: 0
        });
        document.body.appendChild(IFrameDoc);    

        try {
            IFrameDoc.src = this.url;   
        } catch(e) {
            return false;
        }
        
        $(IFrameDoc).observe('load', function(event) {
            $iframe = Event.element(event);
            self.responseText = ($iframe.contentWindow ? $iframe.contentWindow: document.frames[$iframe.id]).document.body.innerHTMLreplace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&');
            self.readyState = 4;
            self.onreadystatechange(event);
        });

    },
    
    createIframe: function() {
        var IFrameDoc = document.createElement('iframe');
        IFrameDoc.setAttribute('id', 'req'+this._req_id);
        IFrameDoc.setAttribute('name', 'req'+this._req_id);
        Object.extend(IFrameDoc.style, {
            width: 0, height: 0, border: 0, margin: 0, padding: 0
        });
        document.body.appendChild(IFrameDoc);    
    },

    overrideMimeType: function() { },

    getResponseHeader: function(/*String*/header){
        return this._responseHeaders[header]; //String
    },
});
Bakend.Ajax.IframeRequest.reqCount = 0;

Bakend.Ajax.IframeFormRequest = Class.create(Bakend.Ajax.IframeRequest, {
    send: function($super, /*String*/stringData) {
        
    }
});

Backend.Prototype = Backend.Prototype || {};
Backend.Prototype.Form = Backend.Prototype.Form || {}
Backend.Prototype.Form.submitWithIframe = function($form) {
    
}


Ajax.getOldTransport = Ajax.getTransport;
Ajax.getIframeTransport = function(method) {
    if ('get' == method) {
        return new new Bakend.Ajax.IframeRequest();
    } else {
        return new new Bakend.Ajax.IframeFormRequest();
    }
}
Ajax.getTransport = function() {
    var thiz = this;
    return Try.these(
      function() {return thiz.getIframeTransport()},
      function() {return thiz.getOldTransport()}
    ) || false;
}

Ajax.Request.prototype.evalResponse = Prototype.emptyFunction;

Ajax.IframeRequest = Class.create(Ajax.request, {
  initialize: function($super, url, newOptions) {
    options = {
      method:       'post',
      asynchronous: true,
      contentType:  'multipart/form-data',
      encoding:     'UTF-8',
      parameters:   ''
    };
    Object.extend(options, newOptions || { });
    $super(options);
    this.transport = Ajax.getIframeTransport(options.method);
    this.request(url);
  },
});
