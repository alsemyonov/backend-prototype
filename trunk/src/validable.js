$ns('Backend.Validable');

/**
 * @todo config с классами.
 * Client-side validator class (Singleton).
 * @class Backend.Validator
 */
Backend.Validable = {
  defaults: {
    create: {after: "<div>aaA</div>"}, // {before: template}
    template: null,
    messageId: null,
    errorClass: 'validation-error'
  },
  setDefaults: function(defaults) {
    Object.extend(this.defaults, defaults || {});
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
    element.vRules = element.vRules || $A();
    args = args || {};
    args = Object.extend(Object.clone(Backend.Validable.defaults), args);
    element.vRules.push([rule, args]);
  },
  check: function(element) {
    element = $(element);
    var rules = element.vRules || $A();
    var results = rules.map(function(r) {
      var rule = r[0];
      var args = r[1];
      var fn = args.fn || Backend.Validable.Validators[rule];
      if (Object.isUndefined(fn)) return;

      var r = !fn(element, args);
      if (r) element._message(rule, args);
      return r;
    }, this);
    return !results.any();
  },
  _message: function(element, rule, args) {
    element.addClassName(args.errorClass);
    var messageId = args.messageId || 'advice-'+element.name+'-'+rule;
    if ($(messageId)) {
      $(messageId).show();
    } else if(args.template) {
      throw new Error("Template messages are not implemented");
    } else if(args.create) {
      var where = Object.keys(args.create)[0];
      var msg = '<div id="'+messageId+'" class="'+args.errorClass+"'>error'+'</div>";
    }
  }
};

Backend.Validable.Validators = {
  notnull: function(element, args) {
    if (element.tagName.toLowerCase() == 'select') {
      if (element.multiple) {
        return element.getValue().length != 0;
      }
    }

    var type = element.type ? element.type.toLowerCase() : '';
    if (type == 'radio') {
      return $(element.form).select('input[name="'+element.name+'"]').pluck('checked').any();
    }
    return element.getValue() != '';    
  },
  notblank: function(element) {
    return element.getValue().strip() != '';
  },
  checked: function(element) {
    return element.checked;
  },
  unchecked: function(element) {
    return !element.checked;
  }
};

Element.addMethods('TEXTAREA', Backend.Validable.Element);
Element.addMethods('INPUT', Backend.Validable.Element);
Element.addMethods('SELECT', Backend.Validable.Element);