if (Backend == undefined) Backend = {};


Backend.Prototype = {};

/**
 * Element extensions.
 * @class Backend.Prototype.Element
 */
Backend.Prototype.Element = {
  /**
   * Moves element down (after next sibling).
   * @todo steps
   */
  moveDown: function (el, index) {
    index = index || 1;
    var row = $(el);
    if (!Object.isUndefined(row)) {
      var nextRow = row.next();
      if (nextRow != null) {
        row.parentNode.insertBefore(nextRow.cloneNode(true), row);
        nextRow.remove();
      }
    }
  },
  
  /**
   * Moves element up (before previous sibling).
   * @todo steps
   */
  moveUp: function (el, index) {
    index = index || 1;
    var row = $(el);
    if (!Object.isUndefined(row)) {
      var prevRow = row.previous();
      if (prevRow != null) {
        prevRow.parentNode.insertBefore(row.cloneNode(true), prevRow);
        row.remove();
      }
    }
  },
  
  /**
   * Calls method if element exists.
   */
  when: function(el, fYes, fNo) {
    if ($(el)) {
      return fYes($(el)) || true;
    } else {
      return typeof fNo == 'function' ? fNo() : false;
    }
  },
  
  /**
   * Creates element usesing another element innerHtml as template.
   * Replace #{id} constructions with __id__.
   */
  evaluate: function(el, attrs) {
    var elTpl = $(el).innerHTML.replace(/__([\w_]+)__/g, '#{$1}');
    var tpl = new Template(elTpl);    
    return tpl.evaluate(attrs);
  }
};

/**
 * <FORM> extensions.
 * @class Backend.Prototype.Form
 * @todo Move setValue for multiple select to <select> extensions.
 */
Backend.Prototype.Form = {
  /**
   * Sets form values from object.
   * See test for example.
   */
  deserializeElements: function(form, elements, values) {
    if (Object.isHash(values)) values = values.toObject();
    
    // Cache is used to search correct radio button value.
    var cached = $H();

    elements.each(function(el) {
      var name = el.name || el.id;
      if (Object.isUndefined(name)) return;
      
      if (!cached.keys().member(name)) {
        var bracketPos = name.indexOf('[');
        name = bracketPos == -1 ? '['+name+']' : '['+name.substring(0, bracketPos)+']'+name.substring(bracketPos);
        name = name.replace('[]', '.shift()')
        name = name.replace(/\[([\w\d]+)\]/g, '["$1"]');     

        try {
          value = eval('values'+name);
        }
        catch(e) {
          return;
        }
      } else {
        value = cached.get(name);
      }
      
      if (Object.isUndefined(value)) {
        return;
      }

      if (el.tagName.toUpperCase() == 'INPUT') {
        if (el.type.toUpperCase() == 'RADIO') {
          if (el.value == value) {
            el.checked = true;
          } else {
            cached.set(el.name, value);
          }
        } else {
          el.setValue(value);
        }
      } else {
        el.setValue(value);
      }
    }, this);
  },

  /**
   * Deserealizes form elements from object.
   */
  deserialize: function(form, values) {
    form.deserializeElements(form.getElements(), values);
  },

  
};

/**
 * Custom checkbox serializer. 
 */
Form.Element.Serializers.inputSelector = function(element, value) {
  if (Object.isUndefined(value)) {
    if (element.value == "") {
      return element.checked;
    } else {
      return element.checked ? element.value : null;
    }
  } else {
    if (element.value == "") {
      element.checked = !!value;
    } else {
      element.checked = element.value == value;
    }
  }
}

/**
 * <SELECT> tag extensions.
 * @class Backend.Prototype.Select
 */
Backend.Prototype.Select = {
  /**
   * Formats array of objects as <option> list.
   */
  formatOptions: function(items, options) {
    options = Object.extend({
      valueMember: 'id', 
      displayMember: 'name',
      before: $A(),
      after: $A()
    }, options);

    if (!Object.isArray(options.before)) options.before = $A();
    if (!Object.isArray(options.after)) options.after = $A();
   
    items = options.before.concat(items, options.after);
    var newOptions = '';

    if (items && items.length > 0) {
        items.each(function(option) {
        option = $H(option);
        var value = option.get(options['valueMember']) || '';
        var display = option.get(options['displayMember']) || '';
        
        newOptions += '<option value="' + value + '">' + display + '</option>';
      });
    }
    return newOptions;
  },

  /**
   * Sets options for select.
   */
  setOptions: function(select, items, options)
  {
    var newOptions = Backend.Prototype.Select.formatOptions(items, options);
    $select = $(select);
    $select.update(newOptions);
  },

  /**
   * Loads options for select from url through ajax request.
   */
  loadOptions: function(select, url, options)
  {
    options = options || {};
    Object.extend(options, typeof url == 'string' ? {'url': url} : url);

    options = Object.extend({
      itemsProperty: 'items',
      shoulDisable: true,
      disableCount: null,
      before: $A(),
      after: $A(),
      onComplete: Prototype.emptyFunction
    }, options);

    if (options.sho)
      select.disabled = true;
      
    new Ajax.Request(options.url, {
      method: 'get',
      onComplete: options.onComplete.wrap(function(old, t, json) {

      json = json || t.responseJS || t.responseText.evalJSON();

      if (options.itemsProperty!='')
        values = json[options.itemsProperty];
        select.setOptions(values, options);

        var disableCount = options.disableCount ? options.disableCount : options.before.length + options.after.length;
        if (select.childElements().length == disableCount) {
          select.disabled = true;
        } else {
          select.disabled = false;
        }
        old(t, json);
      })
    });
    select.fire('change');
    return select;
  } 
};

/*Backend.Prototype.Table = {
    formatters: {
        date: function(inFormat, outFormat, value, id, row) {
            d = Date.parseDate(value, inFormat);
            return d.print(outFormat);
        },
        dateRu: function (value, id, row) {
            return Backend.Prototype.Table.formatters.date('%Y-%m-%d', '%d %b %Y', value);
        }
    },

    containers: {
        email: function (v, row) { if (v) return '<a href="mailto: '+v+'">'+v+'</a>';}
    },

    fill: function(container, rows, columns, rowCallback)
    {
        var info = [];

        var defaultRowCallback = function(r, row) {
            return '<tr>'+r+"</tr>";
        };

        var defaultCellCallback = function(c, row) {
            return '<td>' + (c? c: '&nbsp;') + '</td>';
        };

        var defaultFormatter = function(value, id, row) {
            return value;
        };

        var rowCallback = rowCallback || defaultRowCallback;

        columns.each(function(c) {
            col = {};

            col.id = c.id;
            col.cellCallback = c.cellCallback || defaultCellCallback;
            col.containerCallback = c.containerCallback;
            col.formatter = c.formatter || defaultFormatter;
            col.formatter = Object.isString(col.formatter) ? Backend.Prototype.Table.formatters[c.formatter] : col.formatter;
            info.push(col);
        });

        var result = '';

        $A(rows).each(function(row) {
            var rowResult = '';

            info.each(function(col) {
                col.containerCallback === undefined ?
                    rowResult += col.cellCallback(col.formatter(row[col.id], col.id, row), row) :
                    rowResult += col.cellCallback(col.containerCallback(col.formatter(row[col.id], col.id, row), row));
            });

            rowResult = rowCallback(rowResult, row);

            result += rowResult;
        });


        container.update(result);
    }
};
*/

/*Element.addMethods("TABLE", {
    fill: Backend.Prototype.Table.load
});*/

/*Element.addMethods("TBODY", {
    fill: Backend.Prototype.Table.fill
});

Element.addMethods("THEAD", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("TFOOT", {
    load: Backend.Prototype.Table.load
});*/
    
Element.addMethods("FORM", {
    deserializeElements: Backend.Prototype.Form.deserializeElements,
    deserialize: Backend.Prototype.Form.deserialize
});

Element.addMethods("SELECT", {
    setOptions: Backend.Prototype.Select.setOptions,
    loadOptions: Backend.Prototype.Select.loadOptions
});

Element.addMethods({
    moveUp: Backend.Prototype.Element.moveUp,
    moveDown: Backend.Prototype.Element.moveDown,
    when: Backend.Prototype.Element.when,
    evaluate: Backend.Prototype.Element.evaluate
});