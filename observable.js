/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------
   Observable mixin.
  
   C = Class.Create({
       initialize: function() {
           // Define events
           this.addEvents(['onSave', 'onEdit']);
       }
   });
   C.addMethods(Backend.Observable);

   c.on('onSave', function(args) { } );   // Add event handler.
   c.fire('onSave', 1);                   // Fire event.
   c.purge();                             // Remove all event handlers.
 *---------------------------------------------------------------------------*/
Backend.Observable = {
    addEvents: function(newListeners) {
        this.listeners = this.listeners || {};

        newListeners.each(function(l) {
            if (this.listeners[l] == undefined) {
                this.listeners[l] = [];
            }
        }.bind(this));
    },
    on: function(name, handler) {
        this.listeners = this.listeners || {};

        if (this.listeners[name] == undefined) return;
        this.listeners[name].push(handler);

    },
    onAll: function(handlers) {
        $H(this.listeners).each(function(p) {
            evtName = p.key;
            if (!Object.isUndefined(handlers[evtName]))
                this.on(evtName, handlers[evtName]);
        });    
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