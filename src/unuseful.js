/**
 * Hash class (prototype).
 * @name Hash
 * @class
 */
Hash.addMethods(
/** @scope Hash.prototype */
{
  isset: function(key) {
    return this.keys().member(key);
  }
});

/**
 * Array class (prototype). Contains extension for arrays of objects.
 * @name Array
 * @class
 */
Object.extend(Array.prototype,
/** @scope  Array.prototype */
{
  /** Gets index of first element in array by its property value */
  indexOfBy: function(key, prop) {
    prop = prop || 'id';
    for(var i = 0; i < this.length; i++) {
      if (Object.isHash(this[i])) {
        var value = this[i].get(prop);
      } else {
        var value = this[i][prop];
      }
      if (value == key) {
        return i;
      }
    }
    return -1;
  },
  /** Gets object from array by it's property value */
  get: function(key, prop) {
    prop = prop || 'id';
    return this.find(function(cur) {
      if (Object.isHash(cur)) {
        var value = cur.get(prop);
      } else {
        var value = cur[prop];
      }
      if (value == key) { return cur; }
      return false;
    });
  },
  /** Replaces array item by it's key */
  set: function(key, value, prop) {
    prop = prop || 'id';    
    i = this.indexOfBy(key, prop);
    if (i == -1) {
      this.push(value);
    } else {
      this[i] = value;
    }
  },
  /** Checks array item existance */
  isset: function(key, prop) {
    return this.indexOfBy(key,prop) != -1;
  },
  /** Removes item from array by key */
  unset: function(key, prop) {
    i = this.indexOfBy(key, prop);
    if (i != -1) {
        delete this[i];
    }
  }
});

/*Backend.Prototype.Table = {
    formatters: {
        date: function(inFormat, outFormat, value, id, row) {
            d = Date.parseDate(value, inFormat);
            return d.print(outFormat);
        },
        dateRu: function (value, id, row) {
            return Backend.Prototype.Table.formatters.date('%Y-%m-%d', '%d %b %Y', value);
        }
    },

    containers: {
        email: function (v, row) { if (v) return '<a href="mailto: '+v+'">'+v+'</a>';}
    },

    fill: function(container, rows, columns, rowCallback)
    {
        var info = [];

        var defaultRowCallback = function(r, row) {
            return '<tr>'+r+"</tr>";
        };

        var defaultCellCallback = function(c, row) {
            return '<td>' + (c? c: '&nbsp;') + '</td>';
        };

        var defaultFormatter = function(value, id, row) {
            return value;
        };

        var rowCallback = rowCallback || defaultRowCallback;

        columns.each(function(c) {
            col = {};

            col.id = c.id;
            col.cellCallback = c.cellCallback || defaultCellCallback;
            col.containerCallback = c.containerCallback;
            col.formatter = c.formatter || defaultFormatter;
            col.formatter = Object.isString(col.formatter) ? Backend.Prototype.Table.formatters[c.formatter] : col.formatter;
            info.push(col);
        });

        var result = '';

        $A(rows).each(function(row) {
            var rowResult = '';

            info.each(function(col) {
                col.containerCallback === undefined ?
                    rowResult += col.cellCallback(col.formatter(row[col.id], col.id, row), row) :
                    rowResult += col.cellCallback(col.containerCallback(col.formatter(row[col.id], col.id, row), row));
            });

            rowResult = rowCallback(rowResult, row);

            result += rowResult;
        });


        container.update(result);
    }
};
*/

/*Element.addMethods("TABLE", {
    fill: Backend.Prototype.Table.load
});*/

/*Element.addMethods("TBODY", {
    fill: Backend.Prototype.Table.fill
});

Element.addMethods("THEAD", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("TFOOT", {
    load: Backend.Prototype.Table.load
});*/


  /**
   * Loads options for select from url through ajax request.
   */
  loadOptions: function(select, url, options)
  {
    options = options || {};
    Object.extend(options, typeof url == 'string' ? {'url': url} : url);

    options = Object.extend({
      itemsProperty: 'items',
      disableCount: null,
      before: $A(),
      after: $A(),
      onComplete: Prototype.emptyFunction
    }, options);
     
    new Ajax.Request(options.url, {
      method: 'get',
      onComplete: options.onComplete.wrap(function(old, t, json) {

      json = json || t.responseJS || t.responseText.evalJSON();

      if (options.itemsProperty!='')
        values = json[options.itemsProperty];
        select.setOptions(values, options);
        
        old(t, json);
      })
    });
    select.fire('change');
    return select;
  } 


  if (name[0] == '#') {
      var comp = name.substring(1);
      name = 'div';
      var id = attrs.id;

      attrs = $H(attrs);
      attrs.unset('id')

      Backend.Component.create(comp, id, attrs.toObject());

      attrs = { 'class': 'component', id: id };
  }
