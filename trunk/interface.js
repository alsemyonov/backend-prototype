/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

if(Backend.Observable == undefined)
  throw("backend-interface.js requires including backend's observable.js library");

Backend.Interface = {
    idCounter: 1    // GUID counter.
};

/*
 * Base control class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control = Class.create({
    defaults: {},

    initialize: function(cfg) {
        cfg = cfg || {};
        this.cfg = Object.extend(Object.clone(this.defaults), cfg);

        if (!Object.isString(this.cfg.id)) {
            this.cfg.id = 'element_'+Backend.Interface.idCounter++;
        }

        this.elm = null;
        this.controls = [];
    },

    getHtml: function() {
        return this.getChildrenHtml();
    },

    getChildrenHtml: function() {
        s = '';
        this.controls.each(function(c) {
            s += c.getHtml();
        });
        return s;
    },

    render: function(to) {
        $(to).update(this.getHtml());
        this.afterRender();
    },

    afterRender: function() {
        this.controls.each(function(c) { c.afterRender(); });
        if (this.cfg.id) this.elm = $(this.cfg.id);

        if (!Object.isElement(this.elm)) { 
            throw('Rendering failed for: '+this.cfg.id);
        }
    },

    refresh: function() {
        if (Object.isElement(this.elm)) {
            this.elm.replace(this.getHtml());
            this.afterRender();
        }
    },

    add: function(c) {
        this.controls.push(c);
    },

    remove: function(c) {
        this.controls = this.controls.without(c);
    }
});

/*
 * Base input control class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.InputControl = Class.create(Backend.Interface.Control, {
    initialize: function($super, cfg) {
        if (!Object.isString(cfg.name)) { 
            cfg.name = cfg.id;
        } else if (cfg.name == '') {
            cfg.name = cfg.id;
        }

        $super(cfg);

        this.validatorElm = null;
    },

    getValue: function() {
        return this.elm.value;
    },

    setValue: function(value) {
        this.elm.value = value;
    },

    resetValue: function() {
        this.elm.value = null;
        this.validatorElm.hide();
    },

    getValidatorHtml: function() {
        return '<div class="validation-error" id="validation-error-'+this.cfg.id+'" style="display: none;"></div>';
    },

    afterRender: function($super) {
        $super();
        this.validatorElm = $('validation-error-'+this.cfg.id);
    },

    setError: function(msg) {
        $(this.validatorElm).update(msg);
//        this.validatorElm.show();
    }
});
Backend.Interface.Control.addMethods(Backend.Observable);

/*
 * Button class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Button = Class.create(Backend.Interface.Control, {
    defaults: {
        label: '',
        handler: Prototype.emptyFn
    },

    initialize: function($super, id, cfg) {
        $super(id, cfg);
        this.addEvents(['click']);

        if (Object.isFunction(this.cfg.handler)) {
            this.on('click', this.cfg.handler);
        }
    },

    getHtml: function() {
        return '<input type="button" name="'+this.cfg.id+'" id="'+this.cfg.id+'" value="'+this.cfg.label+'"/>';
    },

    afterRender: function($super) {
        $super();
        this.elm.observe('click', function() { this.fire('click', this); return false; }.bind(this));
    }
});
Backend.Interface.Control.Button.addMethods(Backend.Observable);

/*
 * Input field class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.InputControl.Input = Class.create(Backend.Interface.Control.InputControl, {
    defaults: {
        maxLength: '',
        readOnly: false,
        multiLine: false
    },

    getHtml: function() {
        if (this.cfg.multiLine) {
            return '<textarea name="'+this.cfg.name+'" id="'+this.cfg.id+'" cols="'+this.cfg.cols+'" rows="'+this.cfg.rows+'"></textarea>'+this.getValidatorHtml();
        } else {
            return '<input type="text" name="'+this.cfg.name+'" id="'+this.cfg.id+'" maxLength="'+this.cfg.maxLength+'"></input>'+this.getValidatorHtml();
        }
    }
});

/*
 * Form class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Form = Class.create(Backend.Interface.Control, {
    defaults: {
        method: 'get',
        action: '.',
        enctype: 'multipart/form-data'
    },

    controlClasses: {
        'Textbox': Backend.Interface.Control.InputControl.Input
    },

    initialize: function($super, cfg) {
        $super(cfg);
        this.groups = $H();
        this.fields = $H();
        if (!Object.isUndefined(this.cfg.groups)) {
            this.addGroups(this.cfg.groups);
        }

        if (!Object.isUndefined(this.cfg.fields)) {
            this.addFields(this.cfg.fields);
        }

        if (!Object.isUndefined(this.cfg.controls)) {
            this.addControls(this.cfg.controls);
        }
    },

    getHtml: function() {
        s = '<form id="'+this.cfg.id+'" method="'+this.cfg.method+'" action="'+this.cfg.action+'" enctype="'+this.cfg.enctype+'">';
        s += this.getChildrenHtml();
        s += '</form>';
        return s;
    },

    addGroups: function(groups) {
        $H(groups).each(function(pair) {
            var id = pair.key;
            var type = pair.value.type;

            switch(type) {
                case 'set':
                    var cfg = { id: id + 'Set', legend: pair.value.legend };
                    var g = new Backend.Interface.Control.FieldSet(cfg);
                break;
                case 'panel':
                    var cfg = {} || pair.value.cfg;
                    if (Object.isUndefined(cfg.id)) { cfg.id = id; };
                    var g = new Backend.Interface.Control.Panel(cfg);
                break;
            }

            this.add(g);
            this.groups.set(id, g);
        }.bind(this));
    },

    getGroup: function(groupId) {
        return this.groups.get(groupId);
    },

    addFields: function(fields) {
        $H(fields).each(function(pair) {
            var id = pair.key;

            var cfg = pair.value.cfg;
            var type = pair.value.type;
            var groupId = pair.value.set;
            var label = pair.value.label;
            cfg.id = id;

            group = this.getGroup(groupId);

            if (Object.isUndefined(group)) {
                throw 'Group is not defined: '+groupId;
            }

            var row = new Backend.Interface.Control.FieldSet.Row({label: label});
            if (Object.isString(type)) { 
                var type = new this.controlClasses[type.capitalize()](cfg);
            }

            row.add(type);
            group.add(row);

            this.fields.set(id, type);
        }.bind(this));
    },

    addControls: function(controls) {
        $H(controls).each(function(pair) {
            c = pair.value[1];
            gId = pair.value[0];

            g = this.getGroup(gId);
            g.add(c);
        }.bind(this));
    },

    setValues: function(values) {
        $H(values).each(function(pair) {
            c = this.fields.get(pair.key);
            if (c != undefined) c.setValue(pair.value);
        }.bind(this));
    },

    getValues: function(values) {
        values = {};
        this.fields.each(function(pair) {
            v = pair.value.getValue();
            values[pair.key] = v;
        });

        return values;
    },

    resetValues: function() {
        this.fields.each(function(c) { c.value.resetValue(); });
    },

    getField: function(id) {
        return this.fields.get(id);
    },

    setErrors: function(errors) {
        errors.each(function(pair) {
            f = this.getField(pair.key);
            f.setValidationError(pair.value);
        }.bind(this));
    }
});

/*
 * Field set class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.FieldSet = Class.create(Backend.Interface.Control, {
    getHtml: function() {
        s = '<fieldset id="'+this.cfg.id+'"><legend>'+this.cfg.legend+'</legend>'+this.getChildrenHtml()+'</fieldSet>';
        return s;
    }
});

/*
 * Field set row class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.FieldSet.Row = Class.create(Backend.Interface.Control, {
    getHtml: function() {
        s = '<label id="'+this.cfg.id+'">'+this.cfg.label+'</label>'+this.getChildrenHtml();
        return s;
    }
});

/*
 * Panel (now empty div) class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Panel = Class.create(Backend.Interface.Control, {
    defaults: {
        cls: '',
    },
    getHtml: function() {
        return '<div class="'+this.cfg.cls+'" id="'+this.cfg.id+'">'+this.getChildrenHtml()+'</div>';
    }
});

/*
 * Grid (table) class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Grid = Class.create(Backend.Interface.Control, {
    defaults: {
        cls: 'listTb',
        columns: []
    },

    getHtml: function() {
        s =  '<table id="'+this.cfg.id+'" class="'+this.cfg.cls+'">';
        s += '<thead id="'+this.cfg.id+'Head">';
        s += '<tr>';

        $A(this.cfg.columns).each(function(c) { 
            s += '<th';
            if (c.width) s+=' width="'+c.width+'%"';
            s += '>';
            if (!Object.isUndefined(c.title)) {
                s += c.title;
            }
            s += '</th>';
        });

        s += '</tr>';
        s += '</thead>';
        s += '<tbody id="'+this.cfg.id+'Body">';
        s += '</tbody>';        
        s += '</table>';

        return s;
    },

    afterRender: function($super) {
        $super();
        this.bodyElm = $(this.cfg.id+'Body');
        this.headElm = $(this.cfg.id+'Head');
    },

    getBody: function() {
        return this.bodyElm;
    },

    getHead: function() {
        return this.headElm;
    },

    fill: function(items) {
        this.getBody().fill(items, this.cfg.columns);
    }
});

/*
 * Page navigation class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.PageNav = Class.create(Backend.Interface.Control, {
    defaults: {
        template: {
            active: new Template('<span class="chosen" id="#{id}-page#{no}">#{no}</span>'),
            inactive: new Template('<span id="#{id}-page#{no}"><a href="#" id="#{id}-page#{no}-link">#{no}</a></span>') 
        }
    },

    initialize: function($super, id, cfg) {
        $super(cfg);
        this.addEvents(['click']);
        this.slice = [];
    },

    setSlice: function(slice, chosenPage) {
        this.slice = slice;
        this.chosenPage = chosenPage;
        this.refresh();
    },

    getHtml: function() {
        html = '<div id="'+this.cfg.id+'">';
        this.slice.each(function(no) {
            if (no == this.chosenPage) {
                html += this.cfg.template.active.evaluate({id: this.cfg.id, no: no});
            } else {
                html += this.cfg.template.inactive.evaluate({id: this.cfg.id, no: no});
            }
        }.bind(this));
        html += '</div>';
        return html;
    },

    afterRender: function($super) {
        $super();
        this.slice.each(function(no) {
            if (no != this.chosenPage) {
                elm = $(this.cfg.id + '-page' + no +'-link');
                if (elm != undefined)
                    elm.observe('click', function() { this.fire('click', this, no); return false; }.bind(this));
            }
        }.bind(this));
    }
});
Backend.Interface.Control.PageNav.addMethods(Backend.Observable);