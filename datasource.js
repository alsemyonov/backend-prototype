if(Backend.Prototype == undefined)
  throw("Backend.Data requires including backend's prototype.js library");

/** Model (data source) classes */
Backend.DataSource = {};

Backend.DataSource.Read = function(component, url, args) {
  args = args || {};
  new Ajax.Request(
    url, {
      method: 'post',
      postBody: Object.toJSON(args),
      onComplete: function(t, json) {
        json = json || t.responseJS || t.responseText.evalJSON();
        this.setAllRows(json.records);
      }.bind(component)
    }
  );
};

/** List source */
Backend.DataSource.List = Class.create({
  initialize: function(config) {
    this.configure(config);
    this.load(config.data);
    this.addEvents(['changed', 'save', 'remove']);
  },
  getList: function(args, onLoad) {
    onLoad({
      records: this.data,
      total: this.data.length
    });
  },
  getItem: function(key, onSuccess) {
    onSuccess(this.data[key]);
  },
  saveItem: function(key, item, onSuccess, onFailed) {
    if (!Object.isUndefined(key)) {
      this.data[key] = item;
    } else {
      this.data.push(item);
    }
    onSuccess();
    this.fire('save', this);
  },
  removeItem: function(key, onSuccess) {
    delete this.data[key];
    this.data = this.data.compact();
    onSuccess();
    this.fire('remove', this);
  },
  removeItems: function(keys, onSuccess) {
    this.suspend();
    keys.each(function(k) {
        this.removeItem(k);
    }.bind(this));
    this.resume();
    this.fire('remove', this);
  },
  load: function(data) {
    this.data = data || $A();
    this.fire('changed');
  }
}, Backend.Configurable, Backend.Observable);

Backend.DataSource.List.ValuableDecorator = Class.create(Backend.DataSource.List, {
  getValue: function() {
    return this.data;
  },
  setValue: function(data) {
    this.load(data);
  },
  resetValue: function(data) {
    this.setValue($A());
  }
});

/** List DataSource with remote source */
Backend.DataSource.List.Remote = Class.create(Backend.DataSource.List, {
  initialize: function($super, config) {
    this.setDefaults({
      listUrl: '',
      saveUrl: '',
      getUrl: ''
    });
    $super(config);
    this.addEvents(['requestFailure', 'requestException']);
    
    this.fireFailure = function(t) {
      this.fire('requestFailure', t);
    }.bind(this);
    
    this.fireException = function(t,e) {
      this.fire('requestException', e);
    }.bind(this);
    
    this.complete = function(t, json) {
      try {
        json = json || t.responseJS || t.responseText.evalJSON();
      }
      catch (e) {
        this.fireException(e);
      }
      return json;
    }.bind(this);
    
    this.data = $A();
  },  
  getList: function($super, args, onLoad) {
    args = Object.extend({
      page: 0,
      pageSize: 0,
      sliceLength: 0,
      filter: {}
    }, args);
    
    new Ajax.Request(
      this.config.listUrl, {
        method: 'post',
        postBody: Object.toJSON({
          page: args.page,
          pageSize: args.paginate[0],
          sliceLength: args.paginate[1],
          filter: args.filter
        }),
        onComplete: this.complete.wrap(
          function(p, t, json) {
            json = p(t, json);
            this.data = json.records;
            onLoad(json);
          }.bind(this)
        ),
        onFailure: this.fireFailure,
        onException: this.fireException
      }
    )
  },  
  getItem: function($super, key, onSuccess) {
    new Ajax.Request(
      this.config.getUrl, {
        method: 'post',
        postBody: Object.toJSON({
          id: key
        }),
        onComplete: this.complete.wrap(
          function(p, t, json) {
            json = p(t,json);
            onSuccess(json);
          }
        ),
        onFailure: this.fireFailure,
        onException: this.fireException
      }
    );
  },
  saveItem: function(key, row, onSuccess, onError) {
    new Ajax.Request(
      this.config.saveUrl, {
        method: 'post',
        postBody: Object.toJSON({
          id: key,
          values: row
        }),
        onComplete: this.complete.wrap(
          function(p, t, json) {
            json = p(t,json);
            if (json.result == true) {
              onSuccess(json.id);
              this.fire('save', this);
            } else {
              onError(json.errors);
            }
          }.bind(this)
        ),
        onFailure: this.fireFailure,
        onException: this.fireException
      }
    );    
  },
  removeItem: function(key, onSuccess, onError) {
    new Ajax.Request(
      this.config.removeUrl, {
        method: 'post',
        postBody: Object.toJSON({
          id: key
        }),
        onComplete: this.complete.wrap(
          function(p, t, json) {
            json = p(t,json);
            if (json.result == true) {
              onSuccess();
              this.fire('remove', this);
            } else {
              onError();
            }
          }.bind(this)
        ),
        onFailure: this.fireFailure,
        onException: this.fireException
      }
    );        
  }
});
    