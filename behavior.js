/**
 * Behavior base class.
 * @class Backend.Behavior
 */
Backend.Behavior = Class.create(
/** @scope Backend.Behavior.prototype */
{
    initialize: function(attached, config) {
        this.attached = attached;
        this.configure(config);
        $H(this.attached).each(function(pair) {
            if (pair.value)
                this.attach(pair.key, pair.value);
        }.bind(this));
        this.allOn(config);
    },
    attach: function(id, object) {      
    }
}, Backend.Observable, Backend.Configurable);

/**
 * Defines behavior for in-page list.
 * @class Backend.Behavior.List
 */
Backend.Behavior.List = Class.create(Backend.Behavior, 
/** @scope Backend.Behavior.List.prototype */
{
    initialize: function($super, attached, config) {
        this.setDefaults({
          paginate: [null, null],
          getList: Prototype.emptyFunction
        });
        
        $super(attached, config);
        if (this.config.source) {
            this.config.getList = this.config.source.getList.bind(this.config.source);
            this.config.source.on('changed', this.load.bind(this));
            this.config.source.on('save', this.load.bind(this));
            this.config.source.on('remove', this.load.bind(this));
        }
        this.page = 1;
    },
    load: function() {
        this.config.getList({
            page: this.page, 
            paginate: this.config.paginate
        }, this.onLoad.bind(this));
    },
    onLoad: function(r) {
      this.attached.list.setAllRows(r.records);
        if (!Object.isUndefined(this.attached.total)) {
            $(this.attached.total).update(r.total);
        }
    }
});

/**
 * @class Backend.Behavior.Editor
 */
Backend.Behavior.Editor = Class.create(Backend.Behavior,
/** @scope Backend.Behavior.Editor.prototype */
{
  initialize: function($super, attached, config) {
      this.setDefaults({
        getItem: Prototype.emptyFunction,
        saveItem: Prototype.emptyFunction,
        removeItem: Prototype.emptyFunction,        
        key: null
      });
      $super(attached, config);

      if (this.config.source) {
          this.config.saveItem = this.config.source.saveItem.bind(this.config.source);
          this.config.getItem = this.config.source.getItem.bind(this.config.source);
          this.config.removeItem = this.config.source.removeItem.bind(this.config.source);
      }
  },
  attach: function($super, id, obj) {
    switch(id) {
      case 'list':
        obj.on('editAction', function(sender, x, y) { 
          if (this.config.key) {
            this.edit(this.config.source.data[y][this.config.key]);
          } else {
            this.edit(y);
          }
        }.bind(this));
        
        obj.on('removeAction', function(sender,x,y) {
          if (this.config.key) {
            this.remove(this.config.source.data[y]['id']);
          } else {
            this.remove(y);
          }
        }.bind(this));
      break;
      case 'saveButton':
        obj.on('click', this.save.bind(this));
      break;
      case 'cancelButton':
        obj.invoke('on', 'click', this.cancel.bind(this));
      break;
    }
  },
  edit: function(key) {
    if (this.attached.container) {
      $(this.attached.container).show();
    }
    this.attached.form.values().invoke('resetValue');
    this.keyValue = key;
    this.config.getItem(key, this.onEdit.bind(this));
  },
  add: function() {
    if (this.attached.container) {
      $(this.attached.container).show();
    }
    this.attached.form.values().invoke('resetValue');
    this.onEdit({});
  },
  save: function() {
    var v = {};
    this.attached.form.each(function(f) {
      v[f.key] = f.value.getValue();
    });
    this.config.saveItem(this.keyValue, v, this.onSaveSuccess.bind(this), this.onSaveFailure.bind(this));
  },  
  remove: function(key) {
    this.config.removeItem(key, this.onRemoveSuccess.bind(this));
  },
  onEdit: function(item) {
    this.attached.form.each(function(c) {
      if (!Object.isUndefined(item[c.key])) {
        c.value.setValue(item[c.key]);
      }
    });   
  },
  onSaveSuccess: function(id) {
    if (this.attached.container) {
      $(this.attached.container).hide();
    }    
    this.attached.form.values().invoke('resetValue');
    if (this.attached.container) {
      $(this.attached.container).hide();
    };
    this.keyValue = undefined;
  },
  onSaveFailure: function(errors) {
    $H(errors).each(function(pair) {
      var field = this.attached.form.get(pair.key);
      field.showError(pair.value);
    }.bind(this));
  },
  onRemoveSuccess: function() {
  },
  cancel: function() {
    if (this.attached.container) {
      $(this.attached.container).hide();
    }    
    this.attached.form.values().invoke('resetValue');
  }
});

Backend.Behavior.LinkedLists = Class.create(Backend.Behavior,
/** @scope Backend.Behavior.Editor.prototype */
{
  initialize: function($super, attached, config) {
    this.addEvents(['change']);
    $super(attached, config);
  },
  attach: function($super, id, obj) {
    switch(id) {
        case 'selects':
            var i = 0;
            obj.each(function(s) {
                if (i > 0) {
                    s.select.disable();
                } else {
                    Backend.DataSource.Read(s.select, s.url);
                }
                s.select.on('change', function(s, sender, value) {
                    var filter = {}; filter[s.filter] = value;
                    Backend.DataSource.Read(s.select, s.url, {filter: filter});
                    s.select.enable();
                }.bind(this).curry(obj[i+1]));
                i++
            }.bind(this));
        break;
    }
  }
});