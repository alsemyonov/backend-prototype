/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/
Backend.Data = {
    SortDirection: { Asc: 'ASC', Desc: 'Desc' }    
};

/*
 * Data proxy class.
 *
 * Data proxy is interface between data source in script and actual data
 * source (memory, remote).
 */
Backend.Data.Proxy = Class.create({
        
});

/*
 *  Data source class.
 *
 *  Data source holds list data (array of hashes) and provides methods to
 *  manage list and events to connect this list with data source.
 *
 *  Configuration attributes:
 *    - key - Key column id.
 *
 *  Events: load, removed, created, changed
 *--------------------------------------------------------------------------*/
Backend.Data.Source = Class.create({
    initialize: function(config) {
        this.setDefaults({
            key: 'id'
        });
        this.configure(config);
        this.addEvents(['load', 'removed', 'created', 'changed']);
        this.clear();
    },
    loadData: function(data) {
        this.data = data;
        this.fire('load', this, data);
    },  
    getData: function() {
        return this.data;
    },
    clear: function() {
        this.data = $A();        
    },
    getItem: function(key) {
        item = this.data.find(function(i) { return i[this.config.key] == key; }.bind(this));
        return item;
    },
    saveItem: function(key, item) {
        created = false;

        if (key == null) {
            created = true;
            key = Math.random();
        }

        if (created) {
            item[this.config.key] = key;
            this.data.push(item);
            this.fire('created', this, key, item);
        } else {
            this.data = this.data.collect(function(i) {
                if (i[this.config.key] == key) {
                    return item;                     
                } else {
                    return i;
                }
            }.bind(this));
            this.fire('changed', this, key, item);
        }
    },   
    removeItem: function(key) {
        this.data = this.data.select(function(i) { return i[this.config.key] != key; }.bind(this));
        this.fire('removed', this, key);
    }
}, Backend.Observable, Backend.Configurable);

/*
 * Data proxy class.
 *
 * It provides asynchronous data source access interface.
 *--------------------------------------------------------------------------*/
Backend.Data.Proxy = Class.create({
    initialize: function(config) {
        this.setDefaults({});
        this.addEvents([]);
        this.configure(config);
        
        if (Object.isUndefined(this.config.source)) {
            throw "Data.Proxy source should be connected to Data.Source";
        }
    },
    load: function(args, callback) {
        
    },   
    getData: function() {
        
    },
    getItem: function() {
        
    },
    saveItem: function() {
        
    },    
    removeItem: function() {
        
    }
}, Backend.Observable, Backend.Configurable);

/*
 *  Data row class.
 *    It may be used if you want to define some complex getter/setter
 *    methods.
 *--------------------------------------------------------------------------*/
/*Backend.Data.Row = Class.create(Hash, Backend.Configurable, {
    initialize: function(object, config) {
        this.setDefaults({
           getters: {},
           setters: {} 
        });
        this.configure(config);
    },
    
    get: function($super, key) {
        if (!Object.isUndefined(this.config.getters[key])) {
            getter = this.config.getters[key]
            return getter();
        }
    }
});*/

/*
 *  Remote data source class. Data in this class gets through ajax queries.
 *--------------------------------------------------------------------------*/
Backend.Data.Source.Remote = Class.create(Backend.Data.Source, {
    initialize: function($super, config) {
        this.setDefaults({
            baseUrl: '',
            methods: ['post', 'post', 'post', 'post'],
            ajaxNames: ['getall', 'get', 'save', 'remove'],
            urls: [undefined, undefined, undefined, undefined],
            options: [{}, {}, {}, {}]
        });

        this.addEvents([
            'complete', 'failed', 'exception', 
            'listComplete', 'listFailed', 'listException',
            'getComplete', 'getFailed', 'getException',
            'saveComplete', 'saveFailed', 'saveException',
            'removeComplete', 'removeFailed', 'removeException'
        ]);

        $super(config);
        this.items = $A();
    },

    request: function(methodIndex, methodName, params, callback) {
        scope = {
            source: this,
            callback: callback            
        };
        options = Object.extend({
            method: this.config.methods[methodIndex],
            onSuccess: function(t, json) {
                try {
                json = json || t.responseJS || t.responseText.evalJSON();
                } catch (e) {
                    this.source.fire(methodName+'Failure', this.source, t);
                    this.source.fire('failure', this.source, t);                    
                }
                
                this.source.fire(methodName+'Complete', this.source, json);
                this.source.fire('complete', this.source, json);

                this.callback(json);
            }.bind(scope),
            onFailure: function(t) {
                this.source.fire(methodName+'Failure', this.source, t);
                this.source.fire('failure', this.source, t);
            }.bind(scope),
            onException: function(t, e) {
                this.source.fire(methodName+'Exception', this.source, t, e);
                this.source.fire('failure', t, this.source, t, e);
            }.bind(scope),
            postBody: Object.toJSON(params)
        }, this.config.options[methodIndex]);

        url = this.config.urls[methodIndex] || this.config.baseUrl + '/' + this.config.ajaxNames[methodIndex] + '/';

        new Ajax.Request(
            url, 
            options
        );                
    },
   
    getList: function(args, callback) {       
        params = {};
        if (!Object.isUndefined(args.paginate)) {
            params = Object.extend(params, {
                page: args.page,
                pageSize: args.paginate[0],
                sliceLength: args.paginate[1]
            });
        };
       
        this.request(0, 'list', params, callback);
    },
    
    getItem: function(key, callback) {      
        this.request(1, 'get', { id: key }, callback);        
    },
    
    saveItem: function(key, item, callback) {
        params = { values: item, id: key };

        callback = callback.wrap(function(callback, json) {
            if (json.result != false) {
                this.fire('listChanged', this);
            }
            callback(json);
        }.bind(this));

        this.request(2, 'save', params, callback);
    },
    removeItem: Prototype.emptyFunction,
/*
    setValue: function(value) {
        this.items = value;
    },
    getValue: function() {
        return this.items;
    },
    resetValue: function() {
        this.items = {};
    }*/
});

/**
 * Compound value class.
 *   Compound value is a collection of objects having setValue(), getValue()
 *   and resetValue() methods.
 *--------------------------------------------------------------------------*/
Backend.Data.CompoundValue = Class.create({
    initialize: function(owned) {
        this.owned = $A();
        if (!Object.isUndefined(owned)) {
            this.own(owned);
        }
    },
    own: function(c) {
        if (Object.isArray(c)) {
            this.owned = this.owned.concat(this.owned, c);
        } else {
            this.owned.push(c);
        }
    },
    release: function(c) {
        this.owned.without(c);
    },
    setValues: function(values) {
        values = $H(values);
        this.owned.each(function(c) { 
            var value = values.get(c.id);
            if (!Object.isUndefined(value))
                c.setValue(value);
        });
    },
    getValues: function() {
        var values = $H();
        this.owned.each(function(c) {
            values.set(c.id, c.getValue());
        });
        return values.toObject();
    },
    resetValues: function() {
        this.owned.each(function(c) {
            c.resetValue();
        });
    }
});