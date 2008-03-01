/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/
Backend.Data = {};

/*
 *  Data source abstract class.
 *--------------------------------------------------------------------------*/
Backend.Data.Source = Class.create({
    initialize: function() {
        this.addEvents(['itemChanged', 'itemRemoved', 'itemCreated', 'listChanged']);
    },

    getItem: Prototype.emptyFunction,
    saveItem: Prototype.emptyFunction,
    removeItem: Prototype.emptyFunction,
    getList: Prototype.emptyFunction
}, Backend.Observable);

/*
 *  Memory data source class.
 *--------------------------------------------------------------------------*/
Backend.Data.Source.Memory = Class.create(Backend.Data.Source, {
    initialize: function($super, config) {
        this.setDefaults({
            key: 'id',
            sortBy: ['id', 'ASC']
        });
        this.configure(config);
        $super();
        this.items = $A();
    },
    getItem: function(key, callback) {
        item = this.items.find(function(i) { return i[this.config.key] == key; }.bind(this));
        item = item || {};
        callback(item);
    },
    saveItem: function(key, item, callback) {
        created = false;

        if (key == null) {
            created = true;
            key = Math.random();
        }

        if (created) {
            item[this.config.key] = key;
            this.items.push(item);
            this.fire('itemCreated', this, key, item);
        } else {
            for (i = 0; i < this.items.length; i++)
            {
                if (this.items[i][this.config.key] == key) {
                    item[this.config.key] = key;
                    this.items[i] = item; 
                }
            }
            this.fire('itemChanged', this, key, item);
        }

        this.fire('listChanged', this);

        callback();
    },
    removeItem: function(key, callback) {
        this.items = this.items.select(function(i) { return i[this.config.key] != key; }.bind(this));

        this.fire('itemRemoved', this, key);
        this.fire('listChanged', this);

        callback();
    },
    getList: function(args, callback) {
        callback({items: this.getValue(), total: this.getValue().length});
    },
    setValue: function(value) {
        this.items = value;
    },
    getValue: function() {
        return this.items;
    },
    resetValue: function() {
        this.items = {};
    }
}, Backend.Configurable);

/*
 *  Remote data source class.
 *--------------------------------------------------------------------------*/
Backend.Data.Source.Remote = Class.create(Backend.Data.Source, {
    initialize: function($super, config) {
        this.setDefaults({
            list: {
                url: '',
                options: {
                    method: 'post',
                    parameters: {}
                }
            },
            save: {
                url: '',
                options: {
                    method: 'post',
                    parameters: {}
                }
            },
            get: {
                url: '',
                options: {
                    method: 'post',
                    parameters: {}
                }
            },
            remove: {
                url: '',
                options: {
                    method: 'post',
                    parameters: {}
                }
            }
        });

        this.addEvents([
            'complete', 'failed', 'exception', 
            'listComplete', 'listFailed', 'listException',
            'getComplete', 'getFailed', 'getException',
            'saveComplete', 'saveFailed', 'saveException',
            'removeComplete', 'removeFailed', 'removeException'
        ]);

        $super();
        this.items = $A();
    },

    getList: function(args, callback) {
        scope = {
            source: this,
            callback: callback
        };      

        new Ajax.Request(
            this.config.url, 
            this.options
/*            onComplete: function() {
                this.callback();
            }.bind(scope),
            onFailure: function() {
            }.bind(scope),
            onException: function() {
            }.bind(scope)*/
        );
    },
    getItem: Prototype.emptyFunction,
    saveItem: Prototype.emptyFunction,
    removeItem: Prototype.emptyFunction,

    setValue: function(value) {
        this.items = value;
    },
    getValue: function() {
        return this.items;
    },
    resetValue: function() {
        this.items = {};
    }
});

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
            value = values.get(c.id);
            if (!Object.isUndefined(value))
                c.setValue(value);
        });
    },
    getValues: function() {
        values = $H();
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