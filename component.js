/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

/*
 * Base component class.
 *--------------------------------------------------------------------------*/ 
Backend.Component = Class.create({
    initialize: function(id, config) {
        this.setDefaults({cls: ''});
        this.configure(config);
        this.id = id;
        this.on(config);
    },
    html: function() {
        return '<div id="'+this.id+'" class="'+this.config.cls+'"></div>';
    },
    render: function() {
        $(this.id).replace(this.html());
    },
    hide: function() {
        $(this.id).hide();
    },
    show: function() {
        $(this.id).show();
    }
}, Backend.Observable, Backend.Configurable);

Object.extend(Backend.Component, {
    types: $H(),
    created: $A(),
    groups: $H(),
    idCounter: 1,

    registerType: function(klass) {
        Backend.Component.types.set(klass.type, klass);
    },

    getByType: function(type) {
        return Backend.Component.types.get(type);
    },

    addToGroup: function(g, c) {
        group = Backend.Component.groups.get(g);
        group = group || $A();
        group.push(c);
        Backend.Component.groups.set(g, group);
    },

    load: function() {
        c = $$('.component');

        c.each(function(c) {
            p = c.onclick();

            id = c.id;
            type = p[0];
            config = p[1] || {};

            cls = Backend.Component.getByType(type);
            if (!Object.isUndefined(cls)) {
                obj = new cls(id, config);
                Backend.Component.add(obj);

                if (config.groups) {
                    if (Object.isString(config.groups)) {
                        Backend.Component.addToGroup(config.groups, obj);
                    } else if (Object.isArray(config.groups)) {
                        config.groups.each(function(g) {
                            Backend.Component.addToGroup(g, obj);
                        });
                    }
                }
            }
        });

        this.created.invoke('render');
    },

    add: function(c) {
        this.created.push(c);
    },

    $: function(id) {
        if (!Object.isString(id)) return id;
        return Backend.Component.created.find(function(c) { return c.id == id; });
    },

    $G: function(id) {
        return Backend.Component.groups.get(id);
    },

    $B: function(name, attrs, children) {
        if (Object.isArray(attrs)) {
            children = attrs;
            attrs = {};
        }

        if (name[0] == '#') {
            comp = name.substring(1);
            name = 'div';
            id = attrs.id;

            attrs = $H(attrs);
            attrs.unset('id')
            attrs = attrs.toJSON().gsub('"', '&quot;');
            attrs = "return ['"+comp+"', "+attrs+"];";

            attrs = { class: 'component', id: id, onclick: attrs };
        }

        a = $H(attrs).collect(function(pair) { return pair.key+'="'+pair.value+'"'; }).join(' ');

        ch = '';
        if (Object.isString(children)) {
            ch = children;
        } else if (Object.isArray(children)) {
            ch = children.join('');
        } 

        return '<'+name+' '+a+'>'+ch+'</'+name+'>';
    }
});

$C = Backend.Component.$;
$CG = Backend.Component.$G;
$B = Backend.Component.$B;

/*
 * Page navigator class.
 *--------------------------------------------------------------------------*/ 
Backend.Component.PageNavigator = Class.create(Backend.Component, {
    initialize: function($super, elm, config) {
        this.setDefaults({
            template: {
                active: new Template('<span class="chosen" id="#{id}-page#{no}">#{label}</span>'),
                inactive: new Template('<span id="#{id}-page#{no}"><a href="#" id="#{id}-page#{no}-link">#{label}</a></span>')
            }
        });

        this.chosenPage = 0;
        this.slice = [];

        this.addEvents(['pageChosen']);

        $super(elm, config);
    },

    setSlice: function(slice, chosenPage) {
        this.slice = slice;
        this.chosenPage = chosenPage;
        this.render();
    },

    html: function() {
        s = '<div id="'+this.id+'" class="'+this.config.cls+'">';
        this.slice.each(function(no) {
            if (no == this.chosenPage) {
                s += this.config.template.active.evaluate({id: this.id, no: no, label: no});
            } else {
                s += this.config.template.inactive.evaluate({id: this.id, no: no, label: no});
            }
        }.bind(this));
        s += '</div>';

        return s;
    },

    render: function($super, elm) {
        $super(elm);
        this.slice.each(function(no) {
            if (no != this.chosenPage) {
                lElm = $(this.id + '-page' + no +'-link');
                if (lElm != undefined)
                    lElm.observe('click', function() { this.fire('pageChosen', this, no); return false; }.bind(this));
            }
        }.bind(this));
    }
});
Backend.Component.PageNavigator.type = 'pageNavigator';
Backend.Component.registerType(Backend.Component.PageNavigator);

/*
 * Button class
 *--------------------------------------------------------------------------*/ 
Backend.Component.Button = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        this.setDefaults({
            label: ''
        });
        this.addEvents(['click']);
        $super(id, config);
    },

    html: function () {
        return '<input type="button" id="'+this.id+'" value="'+this.config.label+'"/>'
    },

    render: function($super) {
        $super();
        $(this.id).observe('click', function(b) { this.fire('click', this); }.bind(this));
    }
});

Backend.Component.Button.type = 'button';
Backend.Component.registerType(Backend.Component.Button);

/*
 * Field class
 *--------------------------------------------------------------------------*/ 
Backend.Component.Field = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        $super(id, config);
        form = $C(config.form);
        if (!Object.isUndefined(form)) {
            form.own(this);
        }
        if (!Object.isUndefined(config.value)) { this.setValue(config.value); }
    },

    getValue: function() {
        return $(this.id).value;
    },

    setValue: function(value) {
        $(this.id).value = value;
    },

    resetValue: function() {
        $(this.id).value = '';
        this.hideValidator();
    },

    validatorHtml: function() {
        return '<div id="'+this.id+'-validator" style="display: none;"></div>';
    },

    hideValidator: function() {
    },

    showError: function(msg) {
    }
});

/*
 * Text field class
 *--------------------------------------------------------------------------*/
Backend.Component.TextField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({
            multiline: false,
            rows: '',
            cols: ''
        });
        $super(id, config);
    },

    html: function() {
        s = '';
        if (!this.config.multiline) {
            s += '<input type="text" id="'+this.id+'" class="'+this.config.cls+'"/>';
        } else {
            s += '<textarea id="'+this.id+'" cols="'+this.config.cols+'" rows="'+this.config.rows+'"></textarea>';
        }
        s += this.validatorHtml();

        return s;
    }
});
Backend.Component.TextField.type = 'textfield';
Backend.Component.registerType(Backend.Component.TextField);

/*
 * Flag field class
 *--------------------------------------------------------------------------*/
Backend.Component.FlagField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({cls: 'checks'});
        this.addEvents(['stateChange']);
        $super(id, config);
    },

    html: function() {
        s = '';
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
Backend.Component.FlagField.type = 'flagfield';
Backend.Component.registerType(Backend.Component.FlagField);

/*
 * Multiselect field
 *--------------------------------------------------------------------------*/
Backend.Component.MultiSelectField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({
            size: 10,
            key: 'id',
            label: 'name'
        });
        $super(id, config);
    },

    html: function() {
        return '<select class="'+this.config.cls+'" id="'+this.id+'" multiple="yes" size="'+this.config.size+'"></select>';
    },

    setItems: function(items) {
        $(this.id).update('');

        v = this.getValue();

        o = '';
        items.each(function(v) {
            o += '<option value="'+v[this.config.key]+'">'+v[this.config.label]+'</option>';
        }.bind(this));

        $(this.id).update(o);

        this.setValue(v);
    },

    getValue: function() {
        value = [];
        $A($(this.id).options).each(function(o) { 
            if (o.selected) { value.push(o.value); }
        });
        return value;
    },

    setValue: function(value) {
        this.resetValue();
        $A($(this.id).options).each(function(o) { 
            if (value.member(o.value)) o.selected = true;
        });
    },

    resetValue: function() {
        $A($(this.id).options).each(function(o) {
            o.selected = false;
        });
    }
});
Backend.Component.MultiSelectField.type = 'multiselect';
Backend.Component.registerType(Backend.Component.MultiSelectField);

/*
 * Grid class
 *--------------------------------------------------------------------------*/
Backend.Component.Grid = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        this.setDefaults({
            columns: [],
            rowCb: function(c) { return '<tr>'+c+'</tr>'; }
        });

        this.addEvents([
            'action'
        ]);

        $super(id, config);

        this.columns = $A();

        this.config.columns.each(function(c) {
            type = c[0].capitalize();
            cfg = c[1];

            cfg.parentGrid = this;
            clm = new Backend.Component.Grid.ColumnTypes[type](cfg);
            this.columns.push(clm);
        }.bind(this));
    },

    html: function() {
        s =  '<table class="'+this.config.cls+'" id="'+this.id+'">';
        s += '<thead>';
        s += '<tr id="'+this.id+'-head">';

        this.columns.each(function(c) {
            s += '<th width="'+c.config.width+'">'+c.config.title+'</th>';
        });

        s += '</tr>';
        s += '</thead>';
        s += '<tbody id="'+this.id+'-body">';
        s += '</tbody>';
        s += '</table>';

        return s;
    },

    setItems: function(items) {
        rowCb = this.config.rowCb;

        s = '';

        $A(items).each(function(item) {
            rowS = '';

            this.columns.each(function(c) {
                rowS += c.getContainer(item, this.id);
            }.bind(this));

            rowS = rowCb(rowS);
            s += rowS;
        }.bind(this));

        $(this.id+'-body').update(s);
    }
});

Backend.Component.Grid.type = 'grid';
Backend.Component.registerType(Backend.Component.Grid);

/*
 * Grid column types classes
 *--------------------------------------------------------------------------*/
Backend.Component.Grid.ColumnTypes = {};

Backend.Component.Grid.ColumnTypes.Base = Class.create({
    initialize: function(config) {
        config = config || {};
        this.config = config;
        this.config = Object.extend({
            id: '',
            title: '',
            width: '',
            parentGrid: ''
        }, this.config);
    },

    afterLoad: function() {

    },

    getValue: function(row) {
        return row[this.config.id];
    },

    getContainer: function(row) {
        return '<td>'+this.getValue(row, this.config.parentGrid.id)+'</td>';
    }
});

Backend.Component.Grid.ColumnTypes.Value = Class.create(Backend.Component.Grid.ColumnTypes.Base, {
    initialize: function($super, config) {
        $super(config);

        this.config = Object.extend({
            getter: Prototype.EmptyFn,
            formatter: Prototype.EmptyFn,
            value: null
        }, this.config);
    },

    getValue: function($super, row) {
        if (this.config.value != null) return this.config.value;
        if (this.config.getter != Prototype.EmptyFn) { return this.config.getter(row, this); }
        if (this.config.formatter != Prototype.EmptyFn) { return this.config.formatter(row, this); }

        return $super(row);
    }
});

Backend.Component.Grid.ColumnTypes.Action = Class.create(Backend.Component.Grid.ColumnTypes.Value, {
    initialize: function($super, config) {
        $super(config);

        this.config = Object.extend({
            keyProperty: 'id'
        }, this.config);

        config.parentGrid.addEvents([this.config.id+'Action']);
    },

    getValue: function($super, row) {
        onClick = "$C('"+this.config.parentGrid.id+"').fire('action', '"+this.config.id+"', '"+row[this.config.keyProperty]+"');";
        onClick += "$C('"+this.config.parentGrid.id+"').fire('"+this.config.id+"Action', '"+row[this.config.keyProperty]+"');";

        value = $super(row);
        value = '<a href="#" class="'+this.config.parentGrid.id+'-action-'+this.config.action+'" onclick="'+onClick+'">'+value+'</a>';
        return value;
    }

});

Backend.Component.Grid.ColumnTypes.Control = Class.create(Backend.Component.Grid.ColumnTypes.Base, {
    initialize: function($super, config) {
        $super(config);

        this.config = Object.extend({
            keyProperty: 'id'
        }, this.config);
    },    
});

Backend.Component.Grid.ColumnTypes.Checkbox = Class.create(Backend.Component.Grid.ColumnTypes.Control, {
    initialize: function($super, config) {
        $super(config);
        config.parentGrid.addEvents([this.config.id+'StateChange']);
    },

    getValue: function($super, row) {
        onClick = "$C('"+this.config.parentGrid.id+"').fire('"+this.config.id+"StateChange', this.checked, '"+row[this.config.keyProperty]+"');";

        if (Object.isUndefined(row[this.config.id])) {
            checked = '';
        } else {
            checked = (row[this.config.id] == true) ? 'checked' : '';
        }

        value = '<input type="checkbox" class="'+this.config.parentGrid.id+'-checkbox" onclick="'+onClick+'" '+checked+'></input>';
        return value;
    }
});