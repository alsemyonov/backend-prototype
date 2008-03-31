/*if (Object.isUndefined(window.Backend))*/ Backend = {};
Backend.Prototype = {};

/** JsonML builder function. */
Backend.Prototype.build = function(name, attrs, children, text) {
  name = name.toLowerCase(); 
  
  if (Object.isArray(attrs)) { text = children, children = attrs, attrs = undefined; }
  if (Object.isString(attrs)) { text = attrs, children = $A(), attrs = $H(); }
  if (Object.isString(children)) { text = children, children = $A(); }
  
  children = children || $A(), attrs = attrs || $H(), text = text || '';
   
  var atxt = $H(attrs).collect(function(pair) { return pair.key+'="'+pair.value+'"'; }).join(' ');
  var ret = '<'+name;
  ret += atxt == '' ? '' : ' ' + atxt;
  ret += '>' + text + children.join('') + '</'+name+'>';

  return ret;
};

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
   * Creates element usesing another element content as template.
   * Useful to create cloneable blocks.
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
};

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
      displayMember: 'name'
    }, options);

    if (!Object.isArray(options.before)) options.before = $A();
    if (!Object.isArray(options.after)) options.after = $A();    
   
    items = options.before.concat(items, options.after);

    var toSet = '';

    if (items && items.length > 0) {
        items.each(function(option) {
          var value = option[options.valueMember] || '';
          var display = option[options.displayMember] || '';

          toSet += '<option value="' + value + '">' + display + '</option>';
      });
    }
    return toSet;
  },

  /**
   * Sets options for select.
   */
  setOptions: function(select, items, options) {
    var newOptions = Backend.Prototype.Select.formatOptions(items, options);
    $select = $(select);
    $select.update(newOptions);
  }
};
   
Element.addMethods("FORM", {
    deserializeElements: Backend.Prototype.Form.deserializeElements,
    deserialize: Backend.Prototype.Form.deserialize
});

Element.addMethods("SELECT", {
    setOptions: Backend.Prototype.Select.setOptions
});

Element.addMethods({
    moveUp: Backend.Prototype.Element.moveUp,
    moveDown: Backend.Prototype.Element.moveDown,
    when: Backend.Prototype.Element.when,
    evaluate: Backend.Prototype.Element.evaluate
});

$B = Backend.Prototype.build;