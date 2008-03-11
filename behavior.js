Backend.Behavior = Class.create({
    initialize: function(subs, config) {
        this.subs = subs;
        this.configure(config);
        $H(this.subs).each(function(pair) {
            if (pair.value)
                this.attach(pair.key, pair.value);
        }.bind(this));
        this.on(config);
    },

    attach: Prototype.EmptyFn
}, Backend.Observable, Backend.Configurable);

Backend.Behavior.Editor = Class.create(Backend.Behavior, {
    initialize: function($super, subs, config) {
        this.setDefaults({
            saveItem: Prototype.emptyFunction,
            getItem: Prototype.emptyFunction,
            proxy: null
        });

        this.addEvents(['edit', 'save', 'cancel']);

        $super(subs, config);

        this.keyValue = null;

        if (this.config.source) {
            this.config.saveItem = this.config.source.saveItem.bind(this.config.source);
            this.config.getItem = this.config.source.getItem.bind(this.config.source);
        }
    },

    attach: function(type, sub) {
        switch(type) {
            case 'saveButton':
                sub.on('click', this.saveClick.bind(this));
            break;
            case 'cancelButton':
                sub.on('click', this.cancelClick.bind(this));
            break;
        }
    },

    edit: function(key) {
        this.subs.form.resetValues();
        if (!Object.isUndefined(key)) {
            this.keyValue = key;
            this.config.getItem(key, this.itemReceived.bind(this));
        } else {
            this.keyValue = null;
            this.itemReceived({});
        }
    },

    itemReceived: function(json) {
        if (this.config.closeOnSave) {
            this.subs.container.show();
        }

        this.fire('edit', this, this.keyValue, json);

        this.subs.form.setValues(json);
    },

    saveClick: function() {
        var v = this.subs.form.getValues();
        this.config.saveItem(this.keyValue, v, this.saveConfirmed.bind(this));

        this.fire('save', this, this.keyValue, v);
    },

    saveConfirmed: function(json) {
        if (json.result == false) {
            this.subs.form.owned.invoke('hideValidator');
            if (json.errors) {
                $H(json.errors).each(function(pair) {
                    var field = $C(pair.key);
                    field.showError(pair.value);
                });
            }
        } else {        
            if (this.config.closeOnSave) {
                this.subs.container.hide();
            }
            this.subs.form.resetValues();
        }
    },

    cancel: function() {
        this.cancelClick();
    },

    cancelClick: function() {
        this.fire('cancel', this);

        if (this.config.closeOnSave) {
            this.subs.container.hide();
        }
        this.subs.form.resetValues();
    }
});

Backend.Behavior.List = Class.create(Backend.Behavior, {
    initialize: function($super, subs, config) {
        this.setDefaults({
            getList: Prototype.emptyFunction,
            removeItem: Prototype.emptyFunction
        });

        this.addEvents(['load', 'action', 'pageChosen']);

        $super(subs, config);

        if (this.config.source) {
            this.config.getList = this.config.source.getList.bind(this.config.source);
            this.config.removeItem = this.config.source.removeItem.bind(this.config.source);
        }
        
        this.page = 1;
    },

    attach: function(type, sub) {
        switch(type) {
            case 'list':
                sub.on('action', this.action.bind(this));
            break;

            case 'navigator':
                sub.on('pageChosen', this.pageChosen.bind(this));
            break;
        }
    },

    load: function() {
        this.config.getList({
            page: this.page, 
            paginate: this.config.paginate
        }, this.setItems.bind(this));
    },

    setItems: function(json) {
        this.subs.list.setItems(json.items);
        if (!Object.isUndefined(this.subs.total)) {
            this.subs.total.update(json.total);
        }

        if ((!Object.isUndefined(this.subs.navigator)) && (!Object.isUndefined(json.slice))) {
            this.subs.navigator.setSlice(json.slice, this.page);
            if (!Object.isUndefined(this.subs.totalPages)) {
                this.subs.totalPages.update(json.totalPages);
            }
        }
    },

    pageChosen: function(nav, page) {
        this.fire('pageChosen', this, page);
        this.page = page;
        this.load();
    },

    remove: function(key) {
        this.config.removeItem(key, Prototype.emptyFunction);
    },

    action: function(action, arg) {
        this.fire('action', this, action, arg);
    }
});
