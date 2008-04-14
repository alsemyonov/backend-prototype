$ns('Backend.Observable');

/**
 * Observable mix-in.
 * @static
 * @todo on: scope, args
 */
Backend.Observable = {
    /** Adds event */
    addEvent: function(listener) {
        this.addEvents([listener]);
    },
    /** Adds events */
    addEvents: function(newListeners) {
        this.listeners = this.listeners || {};

        newListeners.each(function(l) {
            if (this.listeners[l] == undefined) {
                this.listeners[l] = [];
            }
        }.bind(this));
    },
    /** Adds event handler */
    on: function(name, handler) {
        this.listeners = this.listeners || {};

        if (this.listeners[name] == undefined) return;
        this.listeners[name].push(handler);

    },
    /** Adds event handlers from object */
    allOn: function(handlers) {
        if (Object.isUndefined(handlers)) return;
        $H(this.listeners).keys().each(function(evtName) {
            if (!Object.isUndefined(handlers[evtName]))
                this.on(evtName, handlers[evtName]);
        });    
    },
    /** Fires event */
    fire: function() {
        args = $A(arguments);
        name = args.shift();

        this.listeners = this.listeners || {};

        if (this.listeners[name] != undefined) {
            this.listeners[name].each(function(e) { 
                e.apply(e, args); 
            });
        }
    },
    /** Purges all events */
    purge: function() {
        this.listeners = {};
    },
    /** Removes event handler */
    removeEvent: function(name, handler) {
        if (this.listeners[name] == undefined) return;
        this.listeners[name] = this.listeners[name].without(handler);
    },
    /** Suspends event handling */
    suspend: function() {
        this.suspendEvents = true;
    },
    /** Resumes event handling */
    resume: function() {
        this.suspendEvents = false;
    }
};