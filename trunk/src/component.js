//if (window.Backend == undefined) Backend = {};

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
 * In-place editor.
 * @class Backend.Component.EditorDecorator
 */
Backend.Component.EditorDecorator = Class.create(Backend.Component, {
  initialize: function($super, id, config) {
    this.setDefaults({
      decoration: id+'Decoration',
      control: id+'Control',
      container: id+'Container'
    });
    $super(id, config);
  },
  render: function() {
    $(this.config.decoration).observe('click', this.switchToControl.bindAsEventListener(this));
    $(this.config.control).observe('change', this.switchToDecoration.bindAsEventListener(this))
  },
  switchToControl: function(e) {
    e.stop();
    $(this.config.decoration).hide();
    $(this.config.control).show();
  },
  switchToDecoration: function(e) {
    $(this.config.decoration).show();
    var control = $(this.config.control);
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
      if (c.action) {
        var clk = "Backend.Component.created.get('"+this.id+"').fire('dispatchAction', '"+c.action+"', "+x+", "+y+"); return false;";
        value = $B('a', {href: '#', onClick: clk}, value);
        value = $B('a', {href: '#', 'class': this.id+'-action-'+c.action}, value);
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