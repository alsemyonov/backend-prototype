$ns('Backend.Behavior');
$rq('Backend.Prototype', 'Backend.Observable', 'Backend.Configurable');

/**
 * Behavior base class.
 * @class Backend.Behavior
 */
Backend.Behavior = Class.create({
  /**
   * @todo Test browsers.
   */
  initialize: function() {
    this.debug = false;
    if (Prototype.Browser.WebKit) {
      this.timer = setInterval(function() {
      if (/loaded|complete/.test(document.readyState)) {
        clearInterval(this.timer);
        delete this.timer;
        this.load();
      }}.bind(this), 10);
    } else if (Prototype.Browser.IE) {
      Event.observe(window, 'load', this._onLoad.bindAsEventListener(this));
    } else {
      Event.observe(document, 'DOMContentLoaded', this._onLoad.bindAsEventListener(this));
    }
  },

  /** Dumb function. 0.3? */
  _onLoad: function(e) {
    if (Prototype.Browser.IE) {
      this.load.bind(this).delay(0.3);
    } else {
      this.load.bind(this)();
    }
  },

  /**
   * Called when page is loaded.
   */
  load: function() {
  }
});

/**
 * Implements beahvior of container of clonable template blocks.
 * @todo 
 */
Backend.Behavior.Cloneable = Class.create({
  initialize: function(config) {    
    this.setDefaults({
      container: null,
      defaultTemplate: null
    });
    this.addEvents(['create', 'remove']);
    this.configure(config);
    this.container = this.config.container;
  },
  count: function() {
    return $(this.container).childElements().length;
  },
  clear: function() {
    $(this.container).update('');
  },
  getRow: function(n) {
    return $(this.container).childElements()[n];
  },
  _getTemplate: function(tplId) {
    return Object.isString(tplId) ? tplId : this.config.defaultTemplate;
  },
  add: function(args, tplId) {
    var tpl = this._getTemplate(tplId);
    args = args || {};
    id = args.__id = this.count();;
    tpl = $(tpl).evaluate(args);
    $(this.container).insert(tpl);
    this.getRow(id).tag = args;
    this.fire('create', this, id, this.getRow(id), this.getRow(id).tag);
    return id;
  },
  addN: function(n, tplId, args) {
    n.times(this.add.bind(this, args, tplId));
  },
  addAll: function(args, tplId) {
    args = args || $A();
    args.each(function f(r) { this.add(r, tplId); }, this);
  },
  insert: function(pos, args, tplId) {
    throw new Error("insert() not implemented");
  },
  insertAllN: function(pos, args, tplId) {
    throw new Error("insertAllN() not implemented");
  },  
  insertAll: function(pos, args, tplId) {
    throw new Error("insertAll() not implemented");
  },
  remove: function(n) {
    n = n || this.count()-1;
    var row = this.getRow(n);
    if (row) {
      this.fire('remove', this, n, row, row.tag)
      row.remove();
    }
  },
  removeN: function(n) {
    for(var i = 0; i < n; i++) this.remove();
  },
  removeAll: function(n) {
    n = n || $A();
    n.sort().reverse();
    n.each(this.remove.bind(this));
  }
}, Backend.Configurable, Backend.Observable);
