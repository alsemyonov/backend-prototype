/** Namespace creation function. */
$ns = function(ns) {
  ns = ns.split('.');
  var name = ns.shift();
  var cmd = '';

  for(n = 0; n < ns.length+1; n++) {
    cmd += 'if (Object.isUndefined(window.'+name+')) window.'+name+'={};';
    name = name+'.'+ns[n];    
  }
  eval(cmd);
};

$ns('Backend.Prototype');  

/** Namespace using function */
// @todo filename echoing
$rq = function() {
  $A(arguments).each(function(ns) {
    if (eval('Object.isUndefined(window.'+ns+');')) {
      throw new Error(ns + ' is required');
    }
  });
};

/** JsonML-like builder function. */
Backend.Prototype.build = function(name, attrs, children, text) {
  name = name.toLowerCase(); 
  
  if (Object.isArray(attrs)) { text = children, children = attrs, attrs = undefined; }
  if (Object.isString(attrs)) { text = attrs, children = $A(), attrs = $H(); }
  if (Object.isString(children)) { text = children, children = $A(); }
  
  children = Object.isArray(children) ? children : $A(), attrs = attrs || $H(), text = text || '';
  
  var atxt = $H(attrs).collect(function(pair) { return pair.key+'="'+pair.value+'"'; }).join(' ');
  var ret = '<'+name;
  ret += atxt == '' ? '' : ' ' + atxt;
  ret += '>' + text + children.join('') + '</'+name+'>';

  return ret;
};
$B = Backend.Prototype.build;

/**
 * Element extensions.
 * @class Backend.Prototype.Element
 */
Backend.Prototype.Element = {
  /**
   * Moves element down (after next sibling).
   * @todo steps
   */
  moveDown: function (element, index) {
    index = index || 1;
    var row = $(element);
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
  moveUp: function (element, index) {
    index = index || 1;
    var row = $(element);
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
  when: function(element, fYes, fNo) {
    if ($(element)) {
      return typeof fYes == 'function' ? fYes($(element)) : true;
    } else {
      return typeof fNo == 'function' ? fNo() : false;
    }
  },
  
  /**
   * Creates element usesing another element content as template.
   * Useful to create cloneable blocks.
   * 
   * Use this as template container:
   * <textarea id="container" style="display: none;" disabled="true">
   * <div id="template#{id}"><input type="text" name="txt#{id}"/></div>
   * </textarea>
   */
  evaluate: function(element, attrs) {    
    //var elTpl = $(el).innerHtml.replace(/__([\w_]+)__/g, '#{$1}');
    var elTpl = $(element).innerHTML;
    if (element.tagName.toLowerCase() == 'textarea') {
        elTpl = elTpl.unescapeHTML();
    }
    var tpl = new Template(elTpl);
    return tpl.evaluate(attrs);
  }
};

/**
 * Event observation functions.
 */
Backend.Prototype.Element.Events = {
  _observe: function() {
    var args = $A(arguments);
    var evt = args.shift(), el = args.shift(), fn = args.shift(), scope = args.shift();
    fn = fn.bindAsEventListener.apply(fn, [scope].concat(args));
    el.observe(evt, fn);
  },
  onClick: function() {
    var args = $A(arguments);
    fn = Backend.Prototype.Element.Events._observe.apply(this, ['click'].concat(args));
  },
  onChange: function() {
    var args = $A(arguments);
    fn = Backend.Prototype.Element.Events._observe.apply(this, ['change'].concat(args));    
  },
  onFocus: function() {
    var args = $A(arguments);
    fn = Backend.Prototype.Element.Events._observe.apply(this, ['focus'].concat(args));    
  },
  onBlur: function() {
    var args = $A(arguments);
    fn = Backend.Prototype.Element.Events._observe.apply(this, ['blur'].concat(args));    
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

Element.addMethods({
  moveUp: Backend.Prototype.Element.moveUp,
  moveDown: Backend.Prototype.Element.moveDown,
  when: Backend.Prototype.Element.when,
  evaluate: Backend.Prototype.Element.evaluate,
  onClick: Backend.Prototype.Element.Events.onClick
});

Element.addMethods("INPUT", {
  onClick: Backend.Prototype.Element.Events.onClick,
  onChange: Backend.Prototype.Element.Events.onClick,
  onFocus: Backend.Prototype.Element.Events.onClick,
  onBlur: Backend.Prototype.Element.Events.onClick
});

Element.addMethods("SELECT", {
  setOptions: Backend.Prototype.Select.setOptions,
  onClick: Backend.Prototype.Element.Events.onClick,
  onChange: Backend.Prototype.Element.Events.onChange,
  onFocus: Backend.Prototype.Element.Events.onFocus,
  onBlur: Backend.Prototype.Element.Events.onBlur
});