/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007-2008 gzigzigzi, (c) 2007-2008 rotuka
 *--------------------------------------------------------------------------*/

// @todo $B вместо return '<>'. 

/*
 * Base component class.
 *   Component is a 'view' part of standard MVC triad.
 *   Each component has:
 *      - Unique id.
 *      - Unique type id (used in $B).
 *      - Container DIV with same id as component.
 *      - Configuration (may be pre set).
 *      - Group(s) this component belongs to.
 *
 *   You coluld define component in such ways:
 *   1) <div class="component" id="c1" onclick="['textfield', {multiline: false}]"/>
 *   2) <div class="component" id="c1"/>
 *      <script>Backend.Component.preConfigure('c1', 'textfield', {multiline: false})"/></script>
 *
 *   To render all components on page call Backend.Component.load();
 *
 *   After creation, components will be accessible through $C() function.
 *   For example, $C('c1') returns component c1.
 *
 *   To add component to a group, define special 'groups' attribute. It
 *   could be group id or of group ids to add component to. To access group,
 *   call $G() function. It returns array of component objects in such group,
 *   or undefined.
 *
 *   Configuration attributes:
 *     - cls - Component container class.
 *--------------------------------------------------------------------------*/ 
Backend.Component = Class.create({
    // Constructor
    initialize: function(id, config) {
        this.id = id;
        this.isRendered = false;        
        this.setDefaults({
            cls: ''
        });
        this.configure(config);        
        this.onAll(config);
    },
    // Returns component HTML.
    toHTML: function() {
        return $B('div', {id: this.id, class: this.config.cls});
    },
    // Renders component.
    render: function() {
        $(this.id).replace(this.toHTML());
    },
    // Hides component.
    hide: function() {
        if (this.isRendered()) {
            $(this.id).hide();
        }
    },
    // Shows component.
    show: function() {
        if (this.isRendered()) {
            $(this.id).show();
        }
    },
    // Returns rendered status.
    isRendered: function() {
        return this.isRendered;
    }
}, Backend.Observable, Backend.Configurable);

/*
 * Component instance methods.
 *--------------------------------------------------------------------------*/ 
Object.extend(Backend.Component, {
    types: $H(),
    created: $A(),
    groups: $H(),
    preConfig: $H(),
        
    // Registers component type string.
    registerType: function(klass) {
        if (Backend.Component.types.keys().include(klass.type)) {
            throw klass.type+" already registered";
        }
        Backend.Component.types.set(klass.type, klass);        
    },
    
    // Returns component class by type string.
    getTypeClass: function(type) {
        return Backend.Component.types.get(type);
    },
    // Presets component configuration.
    preConfigure: function(id, type, config) {
        this.preConfig.set(id, [type, config]);
    },
    // Adds component to a group.
    addToGroup: function(g, c) {
        var group = Backend.Component.groups.get(g);
        group = group || $A();
        group.push(c);
        Backend.Component.groups.set(g, group);
    },
    // Loads components
    load: function() {
        var c = $$('.component');

        c.each(function(c) {
            var p = {};
            if (Object.isFunction(c.onclick)) {
                p = c.onclick();
            } else {
                p = Object.extend(Backend.Component.preConfig.get(c.id), p);
            }
            
            var id = c.id;
            var type = p[0];
            var config = p[1] || {};

            var cls = Backend.Component.getTypeClass(type);
            if (!Object.isUndefined(cls)) {
                var obj = new cls(id, config);
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

    // Adds component to global dictionary.
    add: function(c) {
        this.created.push(c);
    },

    // Global method to get component by id.
    $C: function(id) {
        if (!Object.isString(id)) return id;
        return Backend.Component.created.find(function(c) { return c.id == id; });
    },

    // Global method to get component groups by id.
    $G: function(id) {
        return Backend.Component.groups.get(id);
    },

    // Method to build html as Script.Aculo.Us Builder, but more quickly
    // (generation is text-based, not DOM-based as in Builder).
    //
    // Div with inner textfield component:
    //   html = $B('div', {}, [
    //      $B('#textfield', {id: 'name'})
    //   ])
    $B: function(name, attrs, children) {
        if (Object.isArray(attrs)) {
            children = attrs;
            attrs = {};
        }
        
        if (name[0] == '#') {
            var comp = name.substring(1);
            name = 'div';
            var id = attrs.id;

            attrs = $H(attrs);
            attrs.unset('id')

            Backend.Component.preConfigure(id, comp, attrs.toObject());

            attrs = { class: 'component', id: id};
        }

        var a = $H(attrs).collect(function(pair) { return pair.key+'="'+pair.value+'"'; }).join(' ');

        var ch = '';
        if (Object.isString(children)) {
            ch = children;
        } else if (Object.isArray(children)) {
            ch = children.join('');
        } 

        return '<'+name+' '+a+'>'+ch+'</'+name+'>';
    }
});

$C = Backend.Component.$C;
$G = Backend.Component.$G;
$B = Backend.Component.$B;

/*
 * Button class
 *
 * Configuration attributes:
 *   label - button label.
 *   click - click event handler.
 *--------------------------------------------------------------------------*/ 
Backend.Component.Button = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        this.setDefaults({
            label: ''
        });
        this.addEvents(['click']);
        $super(id, config);
    },

    toHTML: function () {
        return '<input type="button" id="'+this.id+'" value="'+this.config.label+'" class="'+this.config.cls+'"/>'
    },

    render: function($super) {
        $super();
        $(this.id).observe('click', function(b) { this.fire('click', this); }.bind(this));
    }
});

Backend.Component.Button.type = 'button';
Backend.Component.registerType(Backend.Component.Button);

/*
 * Page navigator class.
 *
 * Configuration attributes:
 *   - template (.active, .inactive) - page templates.
 *   - pageChosen - event handler called after page has been chosen.
 *
 * @todo displayFirstAndLast.
 * @todo setChosenPage
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

    // Sets page numbers array and current page.
    setSlice: function(slice, chosenPage) {
        this.slice = slice;
        this.chosenPage = chosenPage;
        this.render();
    },

    toHTML: function() {
        var s = '<div id="'+this.id+'" class="'+this.config.cls+'">';
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
 * Abstract input field class. Provides default methods to get/set/reset value
 * and to show validation messages.
 *
 * Configuration attributes:
 *   - errorCls - Class for validator div.
 *
 * @todo validable
 * @todo changed, blur, focus
 *--------------------------------------------------------------------------*/ 
Backend.Component.Field = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        this.setDefaults({
            errorCls: 'validation-error'
        });
        $super(id, config);
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
        return '<div id="'+this.id+'-validator" class="'+this.config.errorCls+'" style="display: none;"></div>';
    },

    hideValidator: function() {
        if ($(this.id+'-validator'))
            $(this.id+'-validator').hide();
    },

    showError: function(msg) {
        $(this.id+'-validator').update(msg);
        $(this.id+'-validator').show();
    }
});

/*
 * Text field class.
 *
 * Configuration attributes:
 *   - multiline - input/textarea.
 *   - rows - (multiline) line count.
 *   - cols - (multiline) column count.
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

    toHTML: function() {
        var s = '';
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

    toHTML: function() {
        var s = '';
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
 * Radio field class
 *--------------------------------------------------------------------------*/
Backend.Component.RadioField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({
            cls: 'rChecks',
            key: 'id',
            label: 'name',
            variants: []
        });
//        this.addEvents(['stateChange']);
        $super(id, config);
    },

    toHTML: function() {
        var s = '<span id="'+this.id+'">';
        this.config.variants.each(function(v) {
            s += '<input type="radio" name="'+this.id+'" class="'+this.config.cls+'" value="'+v[this.config.key]+'"/><label for="'+this.id+'" class="rLabel">'+v[this.config.label]+'</label>';
        }.bind(this));
        s += '</span>' + this.validatorHtml();
        return s;
    },

//    render: function($super) {
//        $super();
//        $(this.id).observe('change', function() { this.fire('stateChange', this, $(this.id).checked); }.bind(this));
//    },

    getValue: function() {
        var el = $(this.id).childElements().find(function(e) { return e.checked; });
        return el ? el.value : null;
    },

    setValue: function(value) {
        $(this.id).childElements().each(function(e) { if (e.value == value) e.checked = true; });
    },

    resetValue: function(value) {
        $(this.id).childElements().each(function(el) { el.checked = false; });
    }
});
Backend.Component.RadioField.type = 'radiofield';
Backend.Component.registerType(Backend.Component.RadioField);

/*
 * Select field
 *--------------------------------------------------------------------------*/
Backend.Component.SelectField = Class.create(Backend.Component.Field, {
    initialize: function($super, id, config) {
        this.setDefaults({
            size: 1,
            key: 'id',
            label: 'name'
        });
        $super(id, config);
    },

    toHTML: function() {
        var size = this.config.size > 1 ? 'size="'+this.config.size+'"' : '';
        return '<select class="'+this.config.cls+'" id="'+this.id+'" '+size+'></select>' + this.validatorHtml();
    },

    setItems: function(items) {
        $(this.id).update('');

        var v = this.getValue();

        var o = '';
        items.each(function(v) {
            o += '<option value="'+v[this.config.key]+'">'+v[this.config.label]+'</option>';
        }.bind(this));

        $(this.id).update(o);

        this.setValue(v);
    }
});
Backend.Component.SelectField.type = 'selectfield';
Backend.Component.registerType(Backend.Component.SelectField);

/*
 * Multiselect field.
 *
 * Value for this component could be set from array, or from pluck'ed
 * key from array of objects. Default is array.
 *
 * Configuration options:
 *   - size - Size (in lines) of input field.
 *   - valueKey - Defines array key to pluck value.
 *--------------------------------------------------------------------------*/
Backend.Component.MultiSelectField = Class.create(Backend.Component.SelectField, {
    initialize: function($super, id, config) {
        this.setDefaults({
            size: 10,
            valueKey: 'id'
        });
        $super(id, config);
    },

    toHTML: function() {
        return '<select class="'+this.config.cls+'" id="'+this.id+'" multiple="yes" size="'+this.config.size+'"></select>' + this.validatorHtml();
    },

    getValue: function() {
        var value = [];
        $A($(this.id).options).each(function(o) { 
            if (o.selected) { value.push(o.value); }
        });
        return value;
    },

    setValue: function(value) {
        this.resetValue();
        if (this.config.valueKey != '') {
            value = value.pluck(this.config.valueKey);
        }
        
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
Backend.Component.MultiSelectField.type = 'multiselectfield';
Backend.Component.registerType(Backend.Component.MultiSelectField);

/*
 * Signle-column list.
 *--------------------------------------------------------------------------*/
/*Backend.Component.ListField = Class.create(Backend.Component, {
    initialize: function($super, id, config) {
        this.setDefaults({
            cls: 'bList'
        });
        this.items = [];
        $super(id, config);
    },
    
    toHTML: function() {
        return $B('div', {cls: this.config.cls});
    },
    
    setItems: function(value) {
        
    }
    
  
});

Backend.Component.ListField.type = 'listfield';
Backend.Component.registerType(Backend.Component.ListField);
			/*<div class="bList">
				<div>Документ сцуко [<a href="">изменить</a>&nbsp;|&nbsp;<a href="">удалить</a>]</div>
				<div><input type="text" class="small" name="" />&nbsp;[<a href="">удалить</a>]</div>
				<div>Документ нахх [<a href="">изменить</a>&nbsp;|&nbsp;<a href="">удалить</a>]</div>
				<div><select class="small" name=""><option>Документ сцуко</option></select>&nbsp;[<a href="">удалить</a>]</div>
				<div>Документ бля [<a href="">изменить</a>&nbsp;|&nbsp;<a href="">удалить</a>]</div>
				<div><select class="small" name=""><option>Документ сцуко</option></select>&nbsp;<a href="">Добавить</a></div>
				<div><input class="small" type="text" name="values[name]"/>&nbsp;<a href="">Добавить</a></div>
			</div-->*/
  
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
        
        if (this.config.columns) {
            this.setColumns(this.config.columns);
        }
    },

    setColumns: function(columns) {
        this.config.columns = columns;
        this.columns = $A();

        columns.each(function(c) {
            var type = c[0].capitalize();
            var cfg = c[1];
            cfg.parentGrid = this;
            var clm = new Backend.Component.Grid.ColumnTypes[type](cfg);
            this.columns.push(clm);
        }.bind(this));
        
        this.render();
    },

    toHTML: function() {
        var s =  '<table class="'+this.config.cls+'" id="'+this.id+'">';
        s += '<thead>';
        s += '<tr id="'+this.id+'-head">';

        if (Object.isArray(this.columns)) {
            this.columns.each(function(c) {
                s += '<th width="'+c.config.width+'">'+c.config.title+'</th>';
            });
        };

        s += '</tr>';
        s += '</thead>';
        s += '<tbody id="'+this.id+'-body">';
        s += '</tbody>';
        s += '</table>';

        return s;
    },

    setItems: function(items) {
        var rowCb = this.config.rowCb;

        var s = '';

        $A(items).each(function(item) {
            var rowS = '';

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

Backend.Component.Grid.ColumnTypes.Base = Class.create(Backend.Configurable, {
    initialize: function(config) {
        this.setDefaults({
            id: '',
            title: '',
            width: '',
            parentGrid: ''
        });
        this.configure(config);
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
        this.setDefaults({           
            getter: Prototype.EmptyFn,
            formatter: Prototype.EmptyFn,
            value: null,
            dictionaryKey: 'id',
            dictionaryValue: 'name'
        });

        $super(config);
        
        if (!Object.isUndefined(this.config.dictionary)) {
            var dic = {};
            this.config.dictionary.each(function(d) {
                dic[d[this.config.dictionaryKey]] = d[this.config.dictionaryValue];
            }.bind(this));
            this.config.dictionary = dic;
        }
    },

    getValue: function($super, row) {
        if (this.config.value != null) { value = this.config.value; } else 
        if (this.config.getter != Prototype.EmptyFn) { value = this.config.getter(row, this); } else 
        if (this.config.formatter != Prototype.EmptyFn) { value = this.config.formatter(row, this); } else {
            var value = $super(row);
        };
        
        if (!Object.isUndefined(this.config.dictionary)) {
            value = this.config.dictionary[value];
        }
        
        return value;
    }
});

Backend.Component.Grid.ColumnTypes.Action = Class.create(Backend.Component.Grid.ColumnTypes.Value, {
    initialize: function($super, config) {
        $super(config);

        this.config = Object.extend({
            keyProperty: 'id',
            action: null
        }, this.config);

        config.parentGrid.addEvents([this.config.id+'Action']);
    },

    getValue: function($super, row) {
        var onClick = "$C('"+this.config.parentGrid.id+"').fire('action', '"+this.config.action+"', '"+row[this.config.keyProperty]+"');";
        onClick += "$C('"+this.config.parentGrid.id+"').fire('"+this.config.action+"Action', '"+row[this.config.keyProperty]+"');";

        var value = $super(row);
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
        var onClick = "$C('"+this.config.parentGrid.id+"').fire('"+this.config.id+"StateChange', this.checked, '"+row[this.config.keyProperty]+"');";
        
        var checked = '';
        if (!Object.isUndefined(row[this.config.id])) {
            checked = (row[this.config.id] == true) ? 'checked' : '';
        }

        var value = '<input type="checkbox" class="'+this.config.parentGrid.id+'-checkbox" onclick="'+onClick+'" '+checked+'></input>';
        return value;
    }
});