// @todo validable
// @todo changed, blur, focus
// @todo mouseOver, mouseOut
// @todo: grid: headerClickable, headerResizeable, header
// @todo: events sender
// @todo displayFirstAndLast.
// @todo: $B refactor

/**
 * Component. 
 * @class Backend.Component
 * @static
 */
Backend.Component = {
  /** Registered component types. */
  types: $H(),
  /** Created components. */
  created: $H(),
  
  /**
   * Registers component type string (used when building components).
   * @param {class} klass Class
   * @param {string} type Type id
   */
  register: function(klass, type) {
      if (Backend.Component.types.values().member(type)) {
          throw type+" already registered";
      }
      Backend.Component.types.set(type, klass);        
  },
  /**
   * Creates component (factory method).
   * @param {string} id Component id
   * @param {string} type Type id
   * @param {object} config Configuration
   * @returns Component object
   */
  create: function(type, id, config) {
    var klass = this.types.get(type);
    if (Object.isUndefined(klass)) {
      throw "Component class does not registered " + type;
    }
    
    if (!Object.isUndefined(this.created.get(id))) {
      throw "Component with id " + id + " is already created";
    }
    
    var obj = new klass(id, config);
    this.created.set(id, obj);
    return obj;
  },
  /**
   * Loads in-page components.
   */
  load: function() {
    Backend.Component.created.values().invoke('render');
  },
  // Global method to get component by id.
  $C: function(id) {
      if (Object.isString(id)) {
        return Backend.Component.created.get(id);
      } else if (Object.isArray(id)) {
        return Backend.Component.created.findAll(function(c) { return id.member(c.key); });
      }
      return undefined;
  }
};

/**
 * Returns component object by id.
 * @param {string or array} Component id or array of id's.
 */
$C = Backend.Component.$C;

/** Builder function. */
$B = function(name, attrs, children, content) {
  if (Object.isArray(attrs)) {
      children = attrs;
      attrs = {};
  }
  
  if (name[0] == '#') {
      var comp = name.substring(1);
      name = 'div';
      var id = attrs.id;

      attrs = $H(attrs);
      attrs.unset('id')

      Backend.Component.create(comp, id, attrs.toObject());

      attrs = { 'class': 'component', id: id };
  }

  var a = $H(attrs).collect(function(pair) { return pair.key+'="'+pair.value+'"'; }).join(' ');

  var ch = '';
  if ((!Object.isArray(children)) && (!Object.isUndefined(children))) {
      ch = children;
  } else if (Object.isArray(children)) {
      ch = children.join('');
  } 

  return '<'+name+' '+a+'>'+ch+'</'+name+'>';
}

/**
 * Base component class.
 * @class Backend.Component.Base
 */
Backend.Component.Base = Class.create(
/** @scope Backend.Component.Base.prototype */
{
    /**
     * Initializes component.
     * @param {string} id Component id
     * @param {array} config Configuration
     * @config {string} [cls] Class name
     */
    initialize: function(id, config) {
        this.setDefaults({
            cls: ''
        });
        this.configure(config);
        
        this.id = id;
        this.isRendered = false;                
        this.allOn(config);
    },
    /** 
     * @returns {string} Component HTML
     */
    toHTML: function() {
        return $B('div', {id: this.id, 'class': this.config.cls});
    },
    /** Renders component */
    render: function(target) {
      if (Object.isUndefined(target)) {
        $(this.id).replace(this.toHTML());
      } else {
        $(target).replace(this.toHTML());
      }
    },
    /** Hides component */
    hide: function() {
        if (this.isRendered()) {
            $(this.id).hide();
        }
    },
    /** Shows component */
    show: function() {
        if (this.isRendered()) {
            $(this.id).show();
        }
    },
    /** @returns Component visible status */
    isRendered: function() {
        return this.isRendered;
    }
}, Backend.Observable, Backend.Configurable);

/**
 * Button class.
 * @class Backend.Component.Button
 * @extends Backend.Component.Base
 */
Backend.Component.Button = Class.create(Backend.Component.Base,
/** @scope Backend.Component.Button.prototype */
{   
    /**
     * Initializes component.
     * @param {object} $super Superclass
     * @param {string} Id component id
     * @param {object} config Configuration
     * @config {string} label Button label
     */
    initialize: function($super, id, config) {
        this.setDefaults({
            label: ''
        });
        this.addEvents(['click']);
        $super(id, config);
    },
    toHTML: function () {
        return $B('input', {type: 'button', id: this.id, 'class': this.config.cls, value: this.config.label});
    },
    render: function($super) {
        $super();
        $(this.id).observe('click', function(b) { this.fire('click', this); }.bind(this));
    }
});
Backend.Component.register(Backend.Component.Button, 'button');

/**
 * Input field base class. Input field has:
 *   - value
 *   - validation error (div), id = field id + '-validator'
 * @class Backend.Component.Field
 *--------------------------------------------------------------------------*/ 
Backend.Component.Field = Class.create(Backend.Component.Base, {
    initialize: function($super, id, config) {
        this.setDefaults({
            errorCls: 'validation-error'
        });
        $super(id, config);
        if (!Object.isUndefined(this.config.value)) { this.setValue(config.value); }
    },
    getValue: function() {
        return $(this.id).value;
    },
    setValue: function(value) {
        $(this.id).value = value;
    },
    disable: function() {
      $(this.id).disable();
    },
    enable: function() {
      $(this.id).enable();
    },
    resetValue: function() {
        $(this.id).value = '';
        this.hideValidator();
    },
    validatorHtml: function() {
        return $B('div', {id: this.id+'-validator', 'class': this.config.errorCls, style: 'display: none;'});
    },
    hideValidator: function() {
        if ($(this.id+'-validator'))
            $(this.id+'-validator').hide();
    },
    showError: function(msg) {
        $(this.id+'-validator').update(msg);
        $(this.id+'-validator').show();
    }
});

/**
 * Text field class.
 * @class Backend.Component.TextField
 * @extends Backend.Component.Field
 *--------------------------------------------------------------------------*/
Backend.Component.Field.TextField = Class.create(Backend.Component.Field,
/** @scope Backend.Component.TextField.prototype */
{
    /**
     * @param {object} $super Superclass
     * @param {string} id Component id
     * @param {object} config Configuration
     * @config {boolean} [multiline] Is multiline input (default: false)
     * @config {integer} [rows] (multiline: true) Rows count
     * @config {integer} [cols] (multiline: true) Columns count
     */
    initialize: function($super, id, config) {
        this.setDefaults({
            multiline: false,
            rows: '',
            cols: ''
        });
        $super(id, config);
    },
    toHTML: function() {
        var s = '';
        if (!this.config.multiline) {
            s += '<input type="text" id="'+this.id+'" class="'+this.config.cls+'"/>';
        } else {
            s += '<textarea id="'+this.id+'" cols="'+this.config.cols+'" rows="'+this.config.rows+'"></textarea>';
        }
        s += this.validatorHtml();

        return s;
    }
});
Backend.Component.register(Backend.Component.Field.TextField, 'textfield');

/**
 * Flag field class
 * @class Backend.Component.Field.FlagField
 */
Backend.Component.Field.FlagField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({cls: 'checks'});
        this.addEvents(['stateChange']);
        $super(id, config);
    },
    toHTML: function() {
        var s = '';
        s += '<input type="checkbox" id="'+this.id+'" class="'+this.config.cls+'"/>';
        return s;
    },
    render: function($super) {
        $super();
        $(this.id).observe('change', function() { this.fire('stateChange', this, $(this.id).checked); }.bind(this));
    },
    getValue: function() {
        return $(this.id).checked;
    },
    setValue: function(value) {
        $(this.id).checked = (value == true);
    },
    resetValue: function(value) {
        this.setValue(false);
    }
});
Backend.Component.register(Backend.Component.Field.FlagField, 'flagfield');

/**
 * Field with display data abstract class.
 * @class Backend.Component.Field.DataBound
 */
Backend.Component.Field.DataBound = Class.create(Backend.Component.Field,
/** @scope Backend.Component.Field.DataBound.prototype */
{
    initialize: function($super, id, config) {
        $super(id, config);
        if (!Object.isUndefined(this.config.data)) this.setAllRows(this.config.data);
    },
    setAllRows: function(data) {
        this.data = data;
    }
});

/**
 * Radio field class.
 * @class Backend.Component.Field.Radio
 */
Backend.Component.Field.Radio = Class.create(Backend.Component.Field.DataBound,
/** @scope Backend.Component.Field.Radio.prototype */
{
    initialize: function($super, id, config) {
        this.setDefaults({
            cls: 'bChecks',
            itemCls: 'bRadio',
            labelCls: 'bLabel',
            data: $A(),
            valueField: 'id',
            displayField: 'label',
        });
        this.addEvents(['stateChanged']);
        $super(id, config);
    },
    toHTML: function() {       
        return $B('span', {id: this.id, 'class': this.config.cls}, this.validatorHtml());
    },
    renderOptions: function() {
      if(!$(this.id)) return;
        var s = '';
        var i = 0;
        this.data.each(function(v) {
            var value = v[this.config.valueField];
            var label = v[this.config.displayField];
            s += $B('input', {'type': 'radio', id: this.id+i, name: this.id, 'class': this.config.itemCls, value: value}, [
                    $B('label', {'for': this.id+i, 'class': this.config.labelCls}, label)
                 ]);
            i++;            
        }.bind(this));
        $(this.id).update(s);
        this.hookOptionsEvents();
    },    
    render: function($super) {
        $super();
        this.renderOptions();
    },
    hookOptionsEvents: function($super) {
        var i = 0;
        this.data.each(function(v) {
            $(this.id+i).observe('change', function(e) { this.fire('stateChanged', this.getValue()); }.bind(this));
            i++;
        }.bind(this));
    },
    setAllRows: function ($super, data) {
        $super(data);
        this.renderOptions();
    },
    getValue: function() {
        var el = $(this.id).childElements().find(function(e) { return e.checked; });
        return el ? el.value : null;
    },
    setValue: function(value) {
        $(this.id).childElements().each(function(e) { if (e.value == value) e.checked = true; });
    },
    resetValue: function(value) {
        $(this.id).childElements().each(function(el) { el.checked = false; });
        this.hideValidator();
    }
});
Backend.Component.register(Backend.Component.Field.Radio, 'radiofield');

/**
 * Select field.
 * @class Backend.Component.Field.Select
 */
Backend.Component.Field.Select = Class.create(Backend.Component.Field.DataBound,
/** @scope Backend.Component.Field.Select */
{
    initialize: function($super, id, config) {
        this.setDefaults({
            size: 1,
            valueField: 'id',
            displayField: 'label'
        });
        this.addEvents(['change']);
        $super(id, config);
    },
    toHTML: function() {
        var size = this.config.size > 1 ? 'size="'+this.config.size+'"' : '';
        return '<select class="'+this.config.cls+'" id="'+this.id+'" '+size+'></select>' + this.validatorHtml();
    },
    renderOptions: function() {
        $(this.id).update('');
        if (!Object.isArray(this.data)) return;

        var v = this.getValue();

        var o = '';
        this.data.each(function(v) {
            o += '<option value="'+v[this.config.valueField]+'">'+v[this.config.displayField]+'</option>';
        }.bind(this));

        $(this.id).update(o);

        this.setValue(v);    
    },
    render: function($super) {
        $super();
        this.renderOptions();
        $(this.id).observe('change', function(e) { this.fire('change', this, this.getValue())}.bind(this));
    },
    setAllRows: function($super, data) {
        $super(data);
        this.renderOptions();
    }
});
Backend.Component.register(Backend.Component.Field.Select, 'selectfield');

/*
 * Multiselect field.
 *
 * Value for this component could be set from array, or from pluck'ed
 * key from array of objects. Default is array.
 *
 * Configuration options:
 *   - size - Size (in lines) of input field.
 *   - valueKey - Defines array key to pluck value.
 *--------------------------------------------------------------------------*/
Backend.Component.Field.MultiSelect = Class.create(Backend.Component.Field.Select, {
    initialize: function($super, id, config) {
        this.setDefaults({
            size: 10,
            valueKey: 'id'
        });
        $super(id, config);
    },
    toHTML: function() {
        return '<select class="'+this.config.cls+'" id="'+this.id+'" multiple="yes" size="'+this.config.size+'"></select>' + this.validatorHtml();
    },
    getValue: function() {
        var value = [];
        $A($(this.id).options).each(function(o) { 
            if (o.selected) { value.push(o.value); }
        });
        return value;
    },
    setValue: function(value) {
        this.resetValue();
        if (this.config.valueKey != '') {
            value = value.pluck(this.config.valueKey);
        }
        
        $A($(this.id).options).each(function(o) { 
            if (value.member(o.value)) o.selected = true;
        });
    },
    resetValue: function() {
      $A($(this.id).options).each(function(o) {
        o.selected = false;
      });
      this.hideValidator();        
    }
});
Backend.Component.register(Backend.Component.Field.MultiSelect, 'multiselectfield');

/**
 * @class Backend.Component.Switcher
 * @todo Field.DataBound?
 */
Backend.Component.Switcher = Class.create(Backend.Component.Field.DataBound,
{
  initialize: function($super, id, config) {
    this.setDefaults({
      template: {
        inactive: new Template('<li id="#{id}"><a href="#">#{name}</a></li>'),
        active: new Template('<li id="#{id}" class="chosen">#{name}</a></li>'),
        activator: new Template('<a class="dashed" id="#{id}-activator" href="#">#{name}</a>')
      },
      selected: 0
    });
    this.addEvents(['change']);
    $super(id, config);
    this.selected = this.config.selected;
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
    this.fire('change', this, value);
    this.renderVariants();
    this.updateActivator();
  },
  getValue: function() {
    return this.data[this.selected];
  },
  resetValue: function() {
    this.setValue(null);
  },
  setAllRows: function($super, data) {
    $super(data);
    this.renderVariants();
  }
});
Backend.Component.register(Backend.Component.Switcher, 'switcher');

/**
 * Page navigator class.
 * @class Backend.Component.PageNavigator
 */ 
Backend.Component.Switcher.Page = Class.create(Backend.Component.Switcher, {
    initialize: function($super, elm, config) {
        this.setDefaults({
            template: {
                active: new Template('<span class="chosen" id="#{id}">#{pageNo}</span>'),
                inactive: new Template('<span id="#{id}"><a href="#">#{pageNo}</a></span>')
            }
        });
        $super(elm, config);
    },
    setAllRows: function($super, data) {
      data = data.map(function(d) { return {pageNo: d}; });
      $super(data);
    }
});
Backend.Component.register(Backend.Component.Switcher.Page, 'pageSwitcher');

/**
 * Grid class.
 * @class Backend.Component.Grid
 */
Backend.Component.Grid = Class.create(Backend.Component.Field.DataBound,
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
      if (c.action) {
        var clk = "$C('"+this.id+"').fire('dispatchAction', '"+c.action+"', "+x+", "+y+"); return false;";
        value = $B('a', {href: '#', onClick: clk}, value);
      };
      if (c.boolValues) {
        value ? value = c.boolValues[0] : value = c.boolValues[1];
      }     
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

Backend.Component.register(Backend.Component.Grid, 'grid');
