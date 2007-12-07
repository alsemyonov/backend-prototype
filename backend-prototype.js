Backend = {};
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

        elements.each(
            function(e) {
                var nameParts = parseName(e.name);

                r = getValue(values, nameParts);
                value = r[0];
                values = r[1];

                if ((e.tagName == 'SELECT') && (e.multiple == true)) {
                    //TODO.
                } else {
                    if (value != undefined)
                        e.value = value;
                }
            }
        );
    },

    deserialize: function(form, values) {
        form.deserializeElements(form.getElements(), values);
    }
};

Backend.Prototype.Table = {
    formatters: {
        date: function(inFormat, outFormat, value) {
            d = Date.parseDate(value, inFormat);
            return d.print(outFormat);
        },
        dateRu: function (locale, value) {
            return Backend.Prototype.Table.formatters.date("%Y-%m-%d", "%d %b %Y", value);
        }
    },

    containers: {
        email: function (v, row) { return '<a href="mailto: '+v+'">'+v+'</a>'; }
    },

    load: function(container, rows, columns, rowCallback)
    {
        var info = [];

        var defaultRowCallback = function(r, row) {
            return '<tr id="row'+row['id']+'">'+r+"</tr>";
        };

        var defaultCellCallback = function(c, row) {
            return '<td>' + c + '</td>';
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

Backend.Prototype.Select = {
    loadOptions: function(select, options)
    {
        defaultOptions = {
            itemsProperty: 'items', 
            valueField: 'id', 
            labelField: 'title',
            before: '',
            after: '',
            onSuccess: Prototype.emptyFunction
        };
        var $options = $H(defaultOptions).update($H(options));

        var $select = $(select);
        new Ajax.Request($options.get('url'), {
            method: 'get',
            onComplete: function(transport, json) {
                json = json || transport.responseText.evalJSON();
                if (!json) {
                    return;
                }

                json = $H(json);
                values = json.get($options.get('itemsProperty'));

                var newOptions = $options.get('before');
                if (values && values.length > 0) {
                    values.each(function(option) {
                        option = $H(option);
                        newOptions += '<option value="' + option.get($options.get('valueField')) + '">' + option.get($options.get('labelField'))+ '</option>';
                    });
                }
                newOptions += $options.get('after');
                $select.update(newOptions);
                $options.get('onSuccess')();
            }
        });
    }
};

Element.addMethods("FORM", {
    deserializeElements: Backend.Prototype.Form.deserializeElements,
    deserialize: Backend.Prototype.Form.deserialize
});

Element.addMethods("TABLE", {
    load: Backend.Prototype.Table.load,
    fill: Backend.Prototype.Table.fill
});

Element.addMethods("TBODY", {
    load: Backend.Prototype.Table.load,
    fill: Backend.Prototype.Table.fill
});

Element.addMethods("THEAD", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("TFOOT", {
    load: Backend.Prototype.Table.load
});

Element.addMethods("SELECT", {
    loadOptions: Backend.Prototype.Select.loadOptions
});