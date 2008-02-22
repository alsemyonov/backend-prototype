/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

/*
 * Observable mixin.
 *
 *   C = Class.Create({
 *      initialize: function() {
 *          this.addEvents(['onSave', 'onEdit']);
 *      }
 *   });
 *   C.addMethods(Backend.Observable);
 *
 *   c.on('onSave', function(args) { } );
 *   c.fire('onSave', 1);
 *   c.purge();
 *
 *--------------------------------------------------------------------------*/

Backend = {};

Backend.Observable = {
    addEvents: function(newListeners) {
        this.listeners = {} || this.listeners;

        newListeners.each(function(l) {
            if (this.listeners[l] == undefined) {
                this.listeners[l] = [];
            }
        }.bind(this));
    },

    on: function(name, handler) {
        if (!this.listeners[name] == undefined) return;
        this.listeners[name].push(handler);
    },

    fire: function() {
        args = $A(arguments);
        name = args.shift();

        if (this.listeners[name] != undefined) {
            this.listeners[name].each(function(e) { 
                e.apply(e, args); 
            });
        }
    },

    purge: function() {
        this.listeners = {};
    },

    remove: function(name, handler) {
        if (this.listeners[name] == undefined) return;
        this.listeners[name] = this.listeners[name].without(handler);
    },

    suspend: function() {
        this.suspendEvents = true;
    },

    resume: function() {
        this.suspendEvents = false;
    }
};