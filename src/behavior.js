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
    this.rowById = $H();
  },
  count: function() {
    return $(this.container).childElements().length;
  },
  clear: function() {
    $(this.container).update('');
  },
  getRow: function(id) {
    return this.rowById.get(id);
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
    var row = $(this.container).childElements().last();
    this.rowById.set(id, row);
    row.__tag = args;
    row.__id = id;
    this.fire('create', this, id, row, row.__tag);
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
  remove: function(id) {
    if (Object.isUndefined(id)) {
      var lastRow = $(this.container).childElements().last();
      id = lastRow ? lastRow.__id : null;
    }
    if (id != null) {
      var row = this.getRow(id);
      if (row) {
        this.fire('remove', this, id, row, row.__tag)
        row.remove();
      }
    }
  },
  removeN: function(n) {
    n.times(function() {this.remove();}.bind(this), this);
  },
  removeAll: function(ids) {
    ids.each(this.remove, this);
  }
}, Backend.Configurable, Backend.Observable);
