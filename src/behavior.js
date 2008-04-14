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
  load: Prototype.emptyFunction,
  
  /**
   * Shortcut to bind element's click event to funciton.
   */
  onClick: function(element, fn) {
    Element.when(element, function(e) {
      e.onClick(fn, this);
    });
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
    this.addEvents(['beforeCreate', 'create', 'remove', 'replace']);
    this.configure(config);
    this.container = this.config.container;
    this.rowById = $H();
  },
  _getTemplate: function(tplId) {
    return Object.isString(tplId) ? tplId : this.config.defaultTemplate;
  },
  _createRow: function(id, args, tplId) {
    var tpl = this._getTemplate(tplId);
    args.__id = id;
    this.fire('beforeCreate', this, id, args);
    tpl = $(tpl).evaluate(args);
    return tpl;
  },
  _rowAfterCreate: function(id, row, args) {
    this.rowById.set(id, row);
    row.__tag = args;
    row.__id = id;
    this.fire('create', this, id, row, args);
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
  add: function(args, tplId) {
    args = args || {};    
    var id = this.count();
    var tpl = this._createRow(id, args, tplId);
    $(this.container).insert(tpl);
    var row = $(this.container).childElements().last();
    this._rowAfterCreate(id, row, args);
    return id;
  },
  addN: function(n, tplId, args) {
    var r = [];
    n.times(function() {
        r.push(this.add(args, tplId));
    }.bind(this));
  },
  addAll: function(args, tplId) {
    args = args || $A();
    return args.map(function f(r) { this.add(r, tplId); }, this);
  },
  insert: function(id, args, tplId) {
    throw new Error("insert() not implemented");
  },
  insertAllN: function(id, args, tplId) {
    throw new Error("insertAllN() not implemented");
  },  
  insertAll: function(id, args, tplId) {
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
  },
  replace: function(id, args, tplId) {
    args = args || {};    
    var row = this.getRow(id);
    var tpl = this._createRow(id, args, tplId);
    var prevRow = row.previous();
    this.remove(id);
    $(prevRow).insert({after: tpl});
    row = $(prevRow).next();
    this._rowAfterCreate(id, row, args);
    this.fire('replace', id, row, row.__tag);    
  }
}, Backend.Configurable, Backend.Observable);

/**
 * Switcher behavior.
 */
/*Backend.Behavior.Switcher = Class.create(Backend.Component.Cloneable, {
  initialize: function($super, config) {
    this.setDefaults({
      activeTemplate: null,
      inactiveTemplate: null,
      selector: __select,
      selected: 0,
      data: $A()
    });
    this.addEvents(['selected']);
    $super(config);
    this.on('create', function(sender, id, row, args) {
      row.select('.'+this.config.selector).invoke('click', this.setSelected, this, id);
    }.bind(this));
  },
  setData: function(data) {
    this.data = data;
    this.clear();
    this.data.each(function(d, n) {
      if (this.selected == n) {
        this.add(d, this.config.activeTemplate);
      } else {
        this.add(d, this.config.inactiveTemplate);
      }
    }, this);
  },
  setSelected: function(s) {
    this.selected = n;
    this.setData(this.data);
  },
  getSelected: function() {
    return this.selected;
  }
});

/**
 * ???
 */
/*Backend.Behavior.Stateful = Class.create({
  initialize: function(config) {
    this.setDefaults({
      container: null
    });
  }
}, Backend.Configurable, Backend.Observable);

/**
 * @class Backend.Component.Switcher
 * @todo Field.DataBound?
 */
/*Backend.Component.Switchable = Class.create({
  initialize: function(config) {
    this.setDefaults({
      container: null,
      defaultSwitchA: null,
      defaultSwitchB: null,
      selected: null
    });
    this.addEvents(['change']);
    $super(id, config);
    this.selected = this.config.selected;
    this.setData(this.config.data);
  },
  render: function($super) {
    this.renderVariants();
    this.updateActivator();
  },
  updateActivator: function() {
    if ($(this.id+'-activator')) {
      var d = this.data[this.selected] || {};
      d = Object.clone(d);
      d.id = this.id;
      $(this.id+'-activator').replace(this.config.template.activator.evaluate(d));
      $(this.id+'-activator').observe('click', function(e) { $(this.id+'-container').show(); return false;}.bind(this));
    }
  },
  renderVariants: function() {
    if (!Object.isArray(this.data)) return;
    var mrk = ''
    var n = 0;
    this.data.each(function(d) {
      var id = this.id+'-variant-'+n;
      if (this.selected == n) {
        mrk += this.config.template.active.evaluate(Object.extend(Object.clone(d), {id: id}));
      } else {
        mrk += this.config.template.inactive.evaluate(Object.extend(Object.clone(d), {id: id}));
      };
      n++;
    }.bind(this));
    $(this.id).update(mrk);
    n = 0;
    this.data.each(function(d) {
      $(this.id+'-variant-'+n).observe('click', function(e) {
        this.scope.setValue.bind(this.scope)(this.n);
        if ($(this.scope.id+'-container')) {
          $(this.scope.id+'-container').hide();
        }
      }.bind({scope: this, n: n++}));
    }.bind(this));
  },
  setValue: function(value) {
    this.selected = value;
    this.fire('change', this, value, this.data[value]);
    this.renderVariants();
    this.updateActivator();
  },
  getValue: function() {
    return this.data[this.selected];
  },
  resetValue: function() {
    this.setValue(null);
  },
  setData: function(data) {
    this.data = data;
    this.renderVariants();
  }
});

/**
 * Page navigator class.
 * @class Backend.Component.PageNavigator
 */ 
/*Backend.Component.Switcher.Page = Class.create(Backend.Component.Switcher, {
  initialize: function($super, id, config) {
    this.setDefaults({
      template: {
        active: new Template('<span class="chosen" id="#{id}">#{pageNo}</span>'),
        inactive: new Template('<span id="#{id}"><a href="#">#{pageNo}</a></span>')
      },
      data: $A()
    });
    $super(id, config);
  },
  setData: function($super, data) {
    data = data.map(function(d) { return {pageNo: d}; });
    $super(data);
  },
  setValue: function($super, value) {
    this.selected = value;
    this.fire('change', this, this.data[value]['pageNo']);
    this.renderVariants();
    this.updateActivator();
  },
  getValue: function($super) {
    value = $super();
    return  value == undefined ? null : value.pageNo;
  }
});*/

