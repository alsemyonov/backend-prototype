/**
 * @todo config с классами.
 * Client-side validator class.
 * @class Backend.Validator
 */
Backend.Validator = Class.create({
    initialize: function(rules, immediate) {
        rules = rules || $A();
        this.rules = $H(rules);
        this.fnCache = {};

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
    showMessage: function(field, rule) {
        if (Object.isFunction(rule)) return;
        var advId = 'advice-'+field+'-'+rule;
        if ($(advId) != null)
            $(advId).show();
    },        
    hideMessage: function(field, rule) {
        if (Object.isFunction(rule)) return;
        var advId = 'advice-'+field+'-'+rule;
        if ($(advId) != null)
            $(advId).hide();
    },
    hideAllMessages: function() {
        $$('.validation-advice').invoke('hide');
    },
    showAllMessages: function(errors) {
        this.hideAllMessages();
        $H(errors).each(function(f) {
            f.value.each(function(r) {
                this.showMessage(f.key, r);
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
                this.showMessage(field, rule);
                return true;
            } else {
                this.hideMessage(field, rule);
            }
            return false;
        }, this);
        return !Object.isUndefined(valid);
    },    
    validateAll: function() {
        this.hideAllMessages();
        var result = false;
        this.rules.each(function(f) {
            result |= this.validate(f.key, f.value);
        }, this);
        return !result;
    }
});

Backend.Validator.Validators = {
    notblank: function(value) {
        return value != '';
    },
    notnull: function(value) {
        return value != '';
    }
};
