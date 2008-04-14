$ns('Backend.Validable');

/**
 * @todo config с классами.
 * Client-side validator class (Singleton).
 * @class Backend.Validator
 */
Backend.Validable = {
  defaults: {
    message: null,
    errorClass: 'validation-error'
  },
  setDefaults: function(defaults) {
    Object.extend(this.defaults, defaults || {});
  },
  showMessages: function(fields, messages) {
    fields.each(function(f) {
      f = $(f);
      if (!f) return;
      if (messages[f.id]) {
        messages[f.id].each(function(m) {
          $(f).showMessage(m);
        });
      }
    });
  }
};

Backend.Validable.Element = {
  /**
   * .validate('notnull')
   * .validate('notnull', {})
   * options: default + fn
   */
  validate: function(element, rule, args) {
    element = $(element);
    element.rules = element.rules || $H();
    args = args || {};
    args = Object.extend(Object.clone(Backend.Validable.defaults), args);
    element.rules.set(rule, args);
    return element;
  },
  check: function(element, rule) {
    element = $(element);
    var rules = element.rules || $H();
    if (rule) {
      var tmp = $H();
      tmp.set(rule, rules.get(rule));
      rules = tmp;
    }
    var results = rules.map(function(r) {
      var rule = r.key, args = r.value;
      var fn = undefined;
      if (args.server) {
        fn = Backend.Validable.server;
      } else {
        fn = args.fn || Backend.Validable.Validators[rule];
      }
      element.hideMessage(rule);      
      if (Object.isUndefined(fn)) return;

      var r = !fn(element, args);
      if (r) element.showMessage(rule);
      return r;
    }, this);
    return !results.any();
  },
  showMessage: function(element, rule) {
    element = $(element);
    var rules = element.rules || $H();
    var args = rules.get(rule);
    if (!Object.isUndefined(args)) {
      element.addClassName(args.errorClass);
      var msg = args.message || 'advice-'+element.id+'-'+rule;
      if ($(msg)) {
        $(msg).show();
      }
    }
  },
  hideMessage: function(element, rule) {
    element = $(element);
    var rules = element.rules || $H();
    var args = rules.get(rule);
    if (!Object.isUndefined(args)) {
      element.removeClassName(args.errorClass);
      var msg = args.message || 'advice-'+element.id+'-'+rule;
      if ($(msg)) {
        $(msg).hide();
      }
    }
  }
};

Backend.Validable.Validators = {
  notnull: function(element, args) {
    if (element.tagName.toLowerCase() == 'select') {
      if (element.multiple) {
        return element.getValue().length != 0;
      }
      return ((element.getValue() != '') && (element.getValue() != null));
    }
    var type = element.type ? element.type.toLowerCase() : '';
    if (type == 'radio') {
      return $(element.form).select('input[name="'+element.name+'"]').pluck('checked').any();
    }
    return ((element.getValue() != '') && (element.getValue() != null));
  },
  notblank: function(element) {
    return element.getValue().strip() != '';
  },
  checked: function(element) {
    return element.checked;
  },
  unchecked: function(element) {
    return !element.checked;
  },
  server: function(element) {
    return true;
  }
};

Element.addMethods('TEXTAREA', Backend.Validable.Element);
Element.addMethods('INPUT', Backend.Validable.Element);
Element.addMethods('SELECT', Backend.Validable.Element);