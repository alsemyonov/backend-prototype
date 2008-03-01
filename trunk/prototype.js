/* 43343*/ 
Backend.Prototype = {};
Backend.Prototype.Form = {
    deserializeElements: function(form, elements, values) {
        parseName = function(name)
        {
            var brPos = name.indexOf('[');
            var parts = new Array();

            if (brPos == -1) {
                parts.push(name);
            } else {
                parts.push(name.substring(0, brPos));
                name.scan(/\[(\w*)\]/, function(e) { parts.push(e[1]); } );
            }
            return parts;
        };

        // TOO COMPLEX. MAY IT BE REWROTE?
        getValue = function(values, parts) {
            var part = parts[0];
            var value = undefined;

            values = $H(values);

            if (part != '') {
                value = values.get(part);
            } else {
                value = values.get(0);
            }

            if (value != undefined) {
                if (parts.length != 1) {
                    updates = getValue(value, parts.slice(1));
                    values.set(part, updates[1]);
                    return [updates[0], values];
                }

                if (part != '') {
                    values.unset(part);
                } else {
                    values = $A($H(values).values()).slice(1);
                }

                return [value, values];
            }

            return [undefined, values];
        };

        values = $H(values);
        radiosCache = $H();

        elements.each(
            function(e) {
                var nameParts = parseName(e.name);

                function setCheckbox(e, value) {
                    
                }

                if ((e.tagName == 'SELECT') && (e.multiple == true)) {
                    //TODO !!!!!!! REWRITE.
                } else if ((e.tagName == 'INPUT') && (e.className.indexOf('checkbox') != -1)) {
                    r = getValue(values, nameParts);
                    value = r[0];
                    values = r[1];                    
                    
                    if (e.type == 'checkbox') {
                        e.value = 1;
                    } else {
                        $id = e.className.split(' ')[1];
                        e.value = 0;
                        ch = $($id);
                        if (ch != undefined) {
                            ch.checked = value == 1;
                            ch.value = 1;
                        }
                    }
                } if (e.type == 'radio') {
                    if (radiosCache.get(e.name) == undefined) {
                        r = getValue(values, nameParts);
                        value = r[0];
                        values = r[1];
                        radiosCache.set(e.name, value);
                    } else {
                        value = radiosCache.get(e.name);                        
                    }
                    if (e.value == value) e.checked = true;
                } else {
                    r = getValue(values, nameParts);
                    value = r[0];
                    values = r[1];
                    
                    if (value != undefined)
                        e.value = value;
                }

                e.fire('onChange');
            }
        );
    },

    deserialize: function(form, values) {
        form.deserializeElements(form.getElements(), values);
    }
};

Backend.Prototype.Table = {
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

Backend.Prototype.Element = {
    moveDown: function (el) {
        row = $(el);
        nextRow = row.next();
        row.parentNode.insertBefore(nextRow.cloneNode(true), row);
        nextRow.remove();
    },

    moveUp: function (el) {
        row = $(el);
        prevRow = row.previous();
        prevRow.parentNode.insertBefore(row.cloneNode(true), prevRow);
        row.remove();
    }
};

Backend.Prototype.Select = {
    formatOptions: function(items, options)
    {
        options = Object.extend({
            valueField: 'id', 
            labelField: 'name',
            before: '',
            after: ''
        }, options);
        var $options = $H(options);

        var newOptions = $options.get('before');
        if (items && items.length > 0) {
            items.each(function(option) {
                option = $H(option);
                newOptions += '<option value="' + option.get($options.get('valueField')) + '">' + option.get($options.get('labelField'))+ '</option>';
            });
        }
        newOptions += $options.get('after');
        return newOptions;
    },

    setOptions: function(select, items, options)
    {
        newOptions = Backend.Prototype.Select.formatOptions(items, options);
        $select = $(select);
        $select.update(newOptions);
    },

    loadOptions: function(select, url, options)
    {
        options = options || {};
        Object.extend(options, typeof url == 'string' ? {'url': url} : url);

        options = Object.extend({
            itemsProperty: 'items', 
            onComplete: Prototype.emptyFunction
        }, options);
        var $options = options;

        var $select = $(select);
        $select.disabled = true;
        new Ajax.Request($options.url, {
            method: 'get',
            transport: 'xhr',
            onComplete: function(t, json) {
                json = json || t.responseJS || t.responseText.evalJSON();

                if (options.itemsProperty!='')
                    values = json[$options.itemsProperty];

                $select.setOptions(values, $options);
                $select.disabled = false;
                $options.onComplete();
            }
        });
        return select;
    }
};

Element.addMethods("FORM", {
    deserializeElements: Backend.Prototype.Form.deserializeElements,
    deserialize: Backend.Prototype.Form.deserialize
});

Element.addMethods("TABLE", {
    fill: Backend.Prototype.Table.load
});

Element.addMethods("TBODY", {
    fill: Backend.Prototype.Table.fill
});

Element.addMethods("THEAD", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("TFOOT", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("SELECT", {
    setOptions: Backend.Prototype.Select.setOptions,
    loadOptions: Backend.Prototype.Select.loadOptions
});

Element.addMethods({
    moveUp: Backend.Prototype.Element.moveUp,
    moveDown: Backend.Prototype.Element.moveDown
});