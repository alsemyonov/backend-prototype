Backend = {};
Backend.Interface = {};

Backend.Interface.Control = Class.create({
    initialize: function(id) {
        this.id = id;
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
    },

    add: function(c) {
        this.controls.push(c);
    }
});

Backend.Interface.Control.InputControl = Class.create(Backend.Interface.Control, {

});

Backend.Interface.Control.InputControl.Input = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, opt) {
        $super(id);
        this.opt = opt;
    },

    getHtml: function() {
        return '<input type="text" name="'+this.opt.name+'" id="'+this.opt.id+'" maxLength="'+this.opt.maxLength+'"></input>';
    }
});

Backend.Interface.Control.Form = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, opt) {
        $super(id);

        defaults = {
            method: 'get',
            action: '',
            enctype: 'multipart/form-data'
        };

        this.opt = Object.extend(defaults, opt);
    },

    getHtml: function() {
        s = '<form id="'+this.id+'" method="'+this.opt.method+'" action="'+this.opt.action+'" enctype="'+this.opt.enctype+'">';
        s += this.getChildrenHtml();
        s += '</form>';
        return s;
    },

    addSet: function(legend) {
        s = new Backend.Interface.Control.FieldSet(null, legend);
        this.add(s);
        return s;
    }
});

Backend.Interface.Control.FieldSet = Class.create(Backend.Interface.Control, {
    controlClasses: {
        'Input': Backend.Interface.Control.InputControl.Input
    },

    initialize: function($super, id, legend) {
        $super(id);
        this.legend = legend;
    },

    getHtml: function() {
        s = '<fieldset><legend>'+this.legend+'</legend>'+this.getChildrenHtml()+'</fieldSet>';
        return s;
    },

    addRow: function(label, c) {
        row = new Backend.Interface.Control.FieldSet.Row(null, label);

        if (Object.isString(c)) {
            cName = c.capitalize();
            c = new this.controlClasses[cName];
        }

        row.add(c);
        this.add(row);
        return row;
    },

    addRows: function(rows) {
        rows.each(function(r) {
            this.addRow(r[0], r[1]);
        });
    }
});

Backend.Interface.Control.FieldSet.Row = Class.create(Backend.Interface.Control, {
    initialize: function($super, id, label) {
        $super(id);
        this.label = label;
    },

    getHtml: function() {
        s = '<div><label>'+this.label+'</label>'+this.getChildrenHtml()+'</div>';
        return s;
    }
});

BI = Backend.Interface;
