/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

if(typeof Backend.Observable == 'undefined')
  throw("backend-interface.js requires including backend's observable.js library");

Backend.Interface = {
    idCounter: 1
};

/*
 * Base control class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control = Class.create({
    defaults: {},

    initialize: function(id, cfg) {
        cfg = cfg || {};
        this.cfg = Object.extend(Object.clone(this.defaults), cfg);

        if (!Object.isString(id)) {
            id = 'element_'+Backend.Interface.idCounter++;
        }

        this.id = id;
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
        if (this.id) this.elm = $(this.id);

        if (!Object.isElement(this.elm)) { 
            throw('Rendering failed for: '+this.id);
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
 * Panel (empty div) class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Panel = Class.create(Backend.Interface.Control, {
    defaults: {
        cls: '',
    },
    getHtml: function() {
        return '<div class="'+this.cfg.cls+'" id="'+this.id+'">'+this.getChildrenHtml()+'</div>';
    }
});

/*
 * Grid (table) class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.Grid = Class.create(Backend.Interface.Control, {
    defaults: {
        cls: 'listTb'
    },

    getHtml: function() {
        s =  '<table id="'+this.id+'" class="'+this.cfg.cls+'">';
        s += '<thead>';

        $H(this.cfg.columns).each(function(pair) { 
            c = pair.value;
            s += '<th';
            if (c.width) s+=' width="'+c.width+'%"';
            s += '>';
            s += c.title;
            s += '</th>';
        });

        s += '</thead>';
        s += '<tbody id="'+this.id+'Body">';
        s += '<tbody>';        
        s += '</table>';

        return s;
    }
});

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
        return '<input type="button" name="'+this.id+'" id="'+this.id+'" value="'+this.cfg.label+'"/>';
    },

    afterRender: function($super) {
        $super();
        this.elm.observe('click', function() { this.fire('click', this); return false; }.bind(this));
    }
});
Backend.Interface.Control.Button.addMethods(Backend.Observable);

/*
 * Page navigation class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.PageNav = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, cfg) {
        $super(id, cfg);
        this.template = {
            active: new Template('<span class="chosen" id="#{id}-page#{no}">#{no}</span>'),
            inactive: new Template('<span id="#{id}-page#{no}"><a href="#" id="#{id}-page#{no}-link">#{no}</a></span>') 
        };
        this.addEvents(['click']);
        this.slice = [];
    },

    setSlice: function(slice, chosenPage) {
        this.slice = slice;
        this.chosenPage = chosenPage;
        this.refresh();
    },

    getHtml: function() {
        html = '<div id="'+this.id+'">';
        this.slice.each(function(no) {
            if (no == this.chosenPage) {
                html += this.template.active.evaluate({id: this.id, no: no});
            } else {
                html += this.template.inactive.evaluate({id: this.id, no: no});
            }
        }.bind(this));
        html += '</div>';
        return html;
    },

    afterRender: function($super) {
        $super();
        this.slice.each(function(no) {
            if (no != this.chosenPage) {
                elm = $(this.id + '-page' + no +'-link');
                if (elm != undefined)
                    elm.observe('click', function() { this.fire('click', this, no); return false; }.bind(this));
            }
        }.bind(this));
    }
});
Backend.Interface.Control.PageNav.addMethods(Backend.Observable);

/*
 * Base input control class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.InputControl = Class.create(Backend.Interface.Control, {
    defaults: {},

    initialize: function($super, id, cfg) {
        if (!Object.isString(cfg.name)) { 
            cfg.name = id;
        } else if (cfg.name == '') {
            cfg.name = id;
        }

        $super(id, cfg);
    },

    getValue: function() {
        return this.elm.value;
    },

    setValue: function(value) {
        this.elm.value = value;
    }
});

/*
 * Input field class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.InputControl.Input = Class.create(Backend.Interface.Control.InputControl, {
    defaults: {
        id: '',
        name: '',
        maxLength: '',
        readonly: false
    },

    getHtml: function() {
        return '<input type="text" name="'+this.cfg.name+'" id="'+this.id+'" maxLength="'+this.cfg.maxLength+'"></input>';
    }
});

/*
 * File attachment input control.
 */
Backend.Interface.Control.FileUploader = Class.create(Backend.Interface.InputControl, {
    defaults: {
        id: '',
        maxRows: '',
        requestOptions: {
            method: 'frame'
        },
        url: ''
    },

    initialize: function($super, id, cfg) {
        $super(id, cfg);
        this.rows = 0;
    },

    getHtml: function() {
        s = '<div id="'+this.id+'">';

        for(i = 0; i < rows; i++) {
            s += '<input type="file" name="file'+i+'"/>';
        }

        s += '<span><a id="'+this.id+'-add-button">Добавить</a></span>';
        s += '<span><a id="'+this.id+'-upload-button">Закачать</a></span>';
        s += '</div>';
    },

    afterRender: function($super) {
        $super();
    },

    upload: function(afterUpload) {

    }
});

/*
 * Multiline input class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.InputControl.TextArea = Class.create(Backend.Interface.Control.InputControl, {
    defaults: {
        id: '',
        name: ''
    },

    initialize: function($super, id, opt) {
        $super(id, opt);
    },

    getHtml: function() {
        return '<textarea name="'+this.opt.name+'" id="'+this.opt.id+'"></textarea>';
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
        'Input': Backend.Interface.Control.InputControl.Input,
        'Textarea': Backend.Interface.Control.InputControl.TextArea
    },

    initialize: function($super, id, cfg) {
        $super(id, cfg);
        this.valueControls = $H();
        this.currentSet = null;
    },

    getHtml: function() {
        s = '<form id="'+this.id+'" method="'+this.cfg.method+'" action="'+this.cfg.action+'" enctype="'+this.cfg.enctype+'">';
        s += this.getChildrenHtml();
        s += '</form>';
        return s;
    },

    addSet: function(legend) {
        s = new Backend.Interface.Control.FieldSet(null, legend, this);
        this.add(s);
        this.currentSet = s;
        return s;
    },

    addField: function(label, c, cfg) {
        row = new Backend.Interface.Control.FieldSet.Row(null, label);

        p = new Backend.Interface.Control.Panel();
        p.add(row);

        if (Object.isString(c)) {
            cName = c.capitalize();
            c = new this.controlClasses[cName](cfg.id, cfg);
        }

        row.add(c);
        this.currentSet.add(p);
        if (c.getValue != undefined)
            this.valueControls.set(cfg.id, c);
        return row;
    },

    addFields: function() {
        fields = $A(arguments);

        fields.each(function(a) {
            this.addField(a[0], a[1], a[2]);
        }.bind(this));
    },

    setValues: function(values) {
        $H(values).each(function(pair) {
            c = this.valueControls.get(pair.key);
            if (c != undefined) c.setValue(pair.value);
        }.bind(this));
    },

    getValues: function(values) {
        values = {};
        this.valueControls.each(function(pair) {
            v = pair.value.getValue();
            values[pair.key] = v;
        });

        return values;
    }
});

/*
 * Field set class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.FieldSet = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, legend) {
        $super(id);
        this.legend = legend;
    },

    getHtml: function() {
        s = '<fieldset id="'+this.id+'"><legend>'+this.legend+'</legend>'+this.getChildrenHtml()+'</fieldSet>';
        return s;
    }
});

/*
 * Field set row class.
 *--------------------------------------------------------------------------*/ 
Backend.Interface.Control.FieldSet.Row = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, label) {
        $super(id);
        this.label = label;
    },

    getHtml: function() {
        s = '<label id="'+this.id+'">'+this.label+'</label>'+this.getChildrenHtml();
        return s;
    }
});