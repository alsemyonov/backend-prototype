/**
 * In-place editor.
 * @class Backend.Component.EditorDecorator
 */
/*Backend.Component.Decorator = Class.create(Backend.Component, {
  initialize: function($super, id, config) {
    this.setDefaults({
      decoration: id+'Decoration',
      decorator: id+'Decorator',
      container: id+'Container',
      switcherOn: id+'Switcher',
      switcherOff: id+'Switcher',
      redecorate: true,
      disable: false
    });
    $super(id, config);
  },
  render: function() {
    $(this.config.switcherOn).observe('click', function(e) {
      e.stop();
      this.switchToDecorator();
    }.bindAsEventListener(this));
    if (this.config.redecorate) { 
      $(this.config.switcherOff).observe('change', function(e) {
        e.stop();
        this.switchToDecoration();
      }.bindAsEventListener(this));
    }
  },
  switchToDecorator: function() {
    $(this.config.decoration).hide();
    $(this.config.decorator).show();
  },
  switchToDecoration: function(e) {
    $(this.config.decoration).show();
/*    var control = $(this.config.decorator);
    var value = undefined;
    
    if (control.tagName.toLowerCase() == 'select') {
      if (control.multiple == false) {
        value = control.options[control.selectedIndex].textContent;
      }
    }    
    if (control.tagName.toLowerCase() == 'input') {
      if (control.type.toLowerCase() == 'text') {
        value = update($(this.config.control).getValue());
      }
    }
    $(this.config.container).update(value);
    control.hide();
    if (this.config.disableHiddenControl) control.disable();
    $(this.config.decorator).hide();
  }    
});*/
$ns('Backend.Validator');

/**
 * @todo config с классами.
 * Client-side validator class.
 * @class Backend.Validator
 */
Backend.Validator = Class.create({
    initialize: function(rules, immediate, config) {
        rules = rules || $A();
        this.rules = $H(rules);
//        this.fnCache = {};

        this.setDefaults({
            container: window.document,
            messageClass: 'validation-error',
            inputClass: 'validation-error'
        });
        this.configure(config);

        if (immediate) {
            this.rules.each(function(f) {
                if ($(f.key) == null) return;
                this._observeBlur(f.key, f.value);
            }, this);
        }

        this.immediate = true;
    },
    _observeBlur: function(field, rules) {
        var fn = this.blur.bindAsEventListener(this, field, rules);
        $(field).observe('blur', fn);
    },
    addRules: function(field, rules, immediate) {
        this.rules.set(field, rules);
        if (this.immediate) {
            this._observeBlur(field, rules);
        }
    },
    removeRules: function(field, rule) {
        this.rules.unset(field);
        if (this.immediate) {
//            $(field).stopObserving(this.
        }
    },
    showError: function(field, rule) {
        if (Object.isFunction(rule)) return;
        var advId = 'advice-'+field+'-'+rule;
        if ($(advId) != null)
            $(advId).show();
    },        
    hideError: function(field, rule) {
        if (Object.isFunction(rule)) return;
        var advId = 'advice-'+field+'-'+rule;
        if ($(advId) != null)
            $(advId).hide();
    },
    hideAllErrors: function() {
        $(this.config.container).select('.'+this.config.messageClass).invoke('hide');
    },
    showAllErrors: function(errors) {
        this.hideAllErrors();
        $H(errors).each(function(f) {
            f.value.each(function(r) {
                this.showError(f.key, r);
            }, this);
        }, this);                
    },
    blur: function(scope, field, rules) {
        with(scope){this.validate(field, rules); };
    },
    validate: function(field, rules) {
        if ($(field) == null) return true;
        var value = $(field).value;
        var valid = rules.find(function(rule) {
            var fn = !Object.isString(rule) ? rule : Backend.Validator.Validators[rule];
            if (!fn) {
                throw new 'Validation method does not exists: '+rule;
            }
            fn(value);
            if (!fn(value)) {
                this.showError(field, rule);
                return true;
            } else {
                this.hideError(field, rule);
            }
            return false;
        }, this);
        return !Object.isUndefined(valid);
    },    
    validateAll: function() {
        this.hideAllErrors();
        var result = false;
        this.rules.each(function(f) {
            result |= this.validate(f.key, f.value);
        }, this);
        return !result;
    }
}, Backend.Configurable, Backend.Observable);

Backend.Validator.Validators = {
    notblank: function(value) {
        return value != '';
    },
    notnull: function(value) {
        return value != '';
    }
};
$ns('Backend.Behavior');

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
 * Implements beahvior of clonable template block.
 * 
 * Example of template block:
 * <div id="exampleTemplate">
 *   <div id="example__n__">
 *      <div>__n__</div>
 *      <div><a href="#" class="__removeLink">Remove block</a></div>
 *   </div>
 * </div>
 *
 * __n__ constuction is replaced by unique block id.
 * __[id]__ constructions are replaced by increase() argument object properties.
 * Block MUST have id like config.id + '__n__'.
 * removeLink is block selector to automate attach block deletion event.
 *
 * @config {string} id Block id.
 * @config {template} Template id.
 * @config {container} Container id.
 * @todo 
 */
Backend.Behavior.Cloneable = Class.create({
  initialize: function(config) {    
    this.setDefaults({
      id: null,
      template: null,
      container: null
    });
    this.addEvents(['increase', 'remove']);
    this.configure(config);
    this.count = 0;
  },
  increaseClick: function(e) {
    this.increase();
    e.stop();    
  },
  decreaseClick: function(e, n) {
    this.decrease(n);
    e.stop();
  },
  increase: function(args) {
    args = args || {};
    var n = this.count++;
    args.n = n;
    var tpl = $(this.config.template).evaluate(args);
    $(this.config.container).insert(tpl);
    $(this.config.id+n).select('.__removeLink').invoke('observe', 'click', this.decreaseClick.bindAsEventListener(this, n));
    this.fire('increase', this, n);
  },
  increaseAll: function(n, args) {
    n.times
  },
  decrease: function(n) {
    this.fire('decrease', this, n);
    $(this.config.id+n).remove();
  },
  decreaseAll: function() {
    $(this.config.container).update('');
    this.count = 0;
  }
}, Backend.Configurable, Backend.Observable);
$ns('Backend.Component');

/**
 * Base component.
 * @class Backend.Component
 */
Backend.Component = Class.create({
  initialize: function(id, config) {
    this.id = id;
    this.configure(config);
    Backend.Component.created.set(id, this);
  },
  toHTML: function() {
    return undefined;
  },
  render: function() {
    var html = this.toHTML();
    if (!Object.isUndefined(html)){
      $(this.id).replace(html);
    }
  }
}, Backend.Observable, Backend.Configurable);
Backend.Component.created = $H();

/**
 * @class Backend.Component.Switcher
 * @todo Field.DataBound?
 */
Backend.Component.Switcher = Class.create(Backend.Component,
{
  initialize: function($super, id, config) {
    this.setDefaults({
      template: {
        inactive: new Template('<li id="#{id}"><a href="#">#{name}</a></li>'),
        active: new Template('<li id="#{id}" class="chosen">#{name}</a></li>'),
        activator: new Template('<a class="dashed" id="#{id}-activator" href="#">#{name}</a>')
      },
      selected: 0,
      data: $A()
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
Backend.Component.Switcher.Page = Class.create(Backend.Component.Switcher, {
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
});

/**
 * Grid class.
 * @class Backend.Component.Grid
 * @todo Buggy... Renumber events after insert!!!
 * @todo Columns.
 */
Backend.Component.Grid = Class.create(Backend.Component,
/** @scope Backend.Component.Grid.prototype */
{ 
  initialize: function($super, id, config) {
    this.setDefaults({
      cls: 'bGrid',
      thCls: 'bTh',
      header: null,
      recordMap: null
    });
    this.addEvents([
      'dispatchAction', 
    ]);
    $super(id, config);  

    this._prepareRecordMap();
    this.on('dispatchAction', this.dispatchAction.bind(this));
  },
  dispatchAction: function(action, x, y) {
    this.fire(action+'Action', this, x, y);
  },  
  toHTML: function() {
    return $B('table', {'class': this.config.cls, id: this.id}, [
      $B('thead', {id: this.id + '-head'}),
      $B('tbody', {id: this.id + '-body'}),
      $B('tfoot', {id: this.id + '-foot'})
    ]);
  }, 
  render: function($super) {
    $super();
    this.renderHeader();
    this.renderBody();
    this.renderFooter();
  },
  /** Renders grid header */
  renderHeader: function() {
    if (!this.config.header) return;
    var n = 0;
    var ths = this.config.header.map(function(h) {
      h = Object.extend({width: '%', title: '', cls: this.config.thCls}, h);
      return $B('th', {width: h.width, 'class': h.cls, id: this.id+'-header-'+(n++)}, h.title);
    }.bind(this));
       
    var head = $B('tr', {}, ths);
    $(this.id+'-head').update(head);    
  },
  renderBody: function() {
  },
  renderFooter: function() {
  },
  insertRow: function(row, y) {
    this.insertRows($A(row), y);
  },
  insertRows: function(rows, y) {
    y = y || $(this.id+'-body').childElements().length-1;
    y < 0 ? y = 0: y = y;
    y > c.length ? y = c.length-1 : y = y;    
    yCur = y;
    var s = rows.inject('', function(s, r) { return s + this._getRow(r, yCur++)}.bind(this));
    var before = this.getRowElement(y);
    if (Object.isUndefined(before)) {
      $(this.id+'-body').update(s);
    } else {
      before.insert({before: s});
    }
  },
  addRows: function(rows) {
    var y = $(this.id+'-body').childElements().length-1;
    y = y < 0 ? 0 : y;
    var yCur = y;
    var s = rows.inject('', function(s, r) { return s + this._getRow(r, yCur++)}.bind(this));
    var after = this.getRowElement(y);
    if (Object.isUndefined(after)) {
      $(this.id+'-body').update(s);
    } else {
      after.insert({after: s});
    }
  },
  addRow: function(row) {
    this.addRows([row]);
  },
  replaceRow: function(row, y) {
    var s = this._getRow(row, y);
    var el = getRowElement(y);
    if (!Object.isUndefined(el)) {
      el.replace(s);
    }
  },
  removeRow: function(y) {
    this.removeRows([y]);
  },
  removeRows: function(ys) {
    ys = ys.sort().reverse();
    ys.each(function(y) {
      this.getRowElement(y).remove();
    }.bind(this));
  },
  setAllRows: function(rows) {
    this.removeAllRows();
    this.addRows(rows);
  },
  removeAllRows: function() {
    $(this.id + '-body').childElements().invoke('remove');
  },
  //invokeColumn:
  //invokeRow:
  //getCellElement:
  getRowElement: function(y) {
    var c = $(this.id+'-body').childElements();
    y < 0 ? y = 0: y = y;
    y > c.length ? y = c.length-1 : y = y;
    return c[y];
  },
  _prepareRecordMap: function() {
    this.recordMap = this.config.recordMap.map(function(c) {
      var mEl = c;
      if (!Object.isFunction(c.formatter) && (!Object.isUndefined(c.formatter))) {
        mEl.formatter = Backend.Component.Grid.Formatters[c.formatter.type].curry(c.formatter);
      };
      if (c.action) {
        this.addEvent(c.action+'Action');
      }
      return mEl;
    }.bind(this));
  },
  _getRow: function(row, y) {
    x = 0;
    var cells = this.recordMap.map(function(c) {
      var value = c.constantValue;
      if (!Object.isUndefined(c.field)) {
        value = row[c.field];
      };
      if (Object.isFunction(c.getter)) {
        value = c.getter(row);
      };
      if (Object.isFunction(c.formatter)) {
        value = c.formatter(row, value, x, y);
      };
      if (c.boolValues) {
        value ? value = c.boolValues[0] : value = c.boolValues[1];
      }     
      if (c.action) {
        var clk = "Backend.Component.created.get('"+this.id+"').fire('dispatchAction', '"+c.action+"', "+x+", "+y+"); return false;";
        value = $B('a', {href: '#', onClick: clk}, value);
        value = $B('a', {href: '#', 'class': this.id+'-action-'+c.action}, value);
      };
      if (value == "") {
        value = c.spaceReplacement;
      }
      value = value || c.nullReplacement;
      x++;
      var cls = this.id+'-cell-column-'+x+' '+this.id+'-cell-row-'+y;
      return $B('td', {id: this.id+'-cell-'+x+'-'+y, 'class': cls}, value);
    }.bind(this));
    var addCls = y % 2 == 0 ? 'even' : 'odd';    
    var cls = this.id+'-'+addCls+' '+'bGrid-'+addCls;
    return $B('tr', {id: this.id+'-row-'+y, 'class': cls}, cells.join('')+'</tr>');
  }  
});
/** Value formatters */
Backend.Component.Grid.Formatters = {
  'dictionary': function(config, row, value, x, y) {
    value = $A(config.values).get(value, config.key);
    if (!Object.isUndefined(value)) {
      value = value[config.value];
    }
    return value;
  }
};