/** 
 * Date Object Extensions. 
 * Copyright Mihai Bazon, 2002-2005  |  www.bazon.net/mishoo
 * -----------------------------------------------------------
 *
 * The DHTML Calendar, version 1.0 "It is happening again"
 *
 * Victor V. Sokolov, 2007 - some changes to locale logic.
 */

//TODO: IS LEAP YEAR, SETFULLEAR WITH THIS CHECK, COMPLETELY REFACTOR THIS

Object.extend(Date, {
    locales: {
        // TODO
        en: {
            _DN: [
             "Sunday",
             "Monday",
             "Tuesday",
             "Thursday",
             "Wednesday",
             "Friday",
             "Saturday",
             "Sunday" ],
            
            _SDN: [
             "��",
             "��",
             "��",
             "��",
             "��",
             "��",
             "��",
             "��"],

            _FD: 1,

            _MN: [
                "January",
             "February",
             "March",
             "April",
             "May",
             "June",
             "July",
             "August",
             "September",
             "October",
             "November",
             "December"],

            _SMN: [
            ]
        },

        ru: {
            _DN: [
                "Воскресенье",
                "Понедельник",
                "Вторник",
                "Среда",
                "Четверг",
                "Пятница",
                "Суббота",
                "Воскресенье"
            ],
            
            _SDN: [
                "Вс",
                "Пн",
                "Вт",
                "Ср",
                "Чт",
                "Пт",
                "Сб",
                "Вс"
            ],

            _FD: 1,

            _MN: [
                "Январь",
                "Февраль",
                "Март",
                "Апрель",
                "Май",
                "Июнь",
                "Июль",
                "Август",
                "Сентябрь",
                "Октябрь",
                "Ноябрь",
                "Декабрь"
            ],

            _SMN: [
                "января",
                "февраля",
                "марта",
                "апреля",
                "мая",
                "июня",
                "июля",
                "августа",
                "сентября",
                "октября",
                "ноября",
                "декабря"
            ]
        }
    },

    _MD: new Array(31,28,31,30,31,30,31,31,30,31,30,31),
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,

    parseDate: function(str, fmt) {
        var today = new Date();
        var y = 0;
        var m = -1;
        var d = 0;
        var a = str.split(/\W+/);
        var b = fmt.match(/%./g);
        var i = 0, j = 0;
        var hr = 0;
        var min = 0;
        for (i = 0; i < a.length; ++i) {
            if (!a[i])
                continue;
            switch (b[i]) {
                case "%d":
                case "%e":
                d = parseInt(a[i], 10);
                break;

                case "%m":
                m = parseInt(a[i], 10) - 1;
                break;

                case "%Y":
                case "%y":
                y = parseInt(a[i], 10);
                (y < 100) && (y += (y > 29) ? 1900 : 2000);
                break;

                case "%b":
                case "%B":
                for (j = 0; j < 12; ++j) {
                    if (locale._MN[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { m = j; break; }
                }
                break;

                case "%H":
                case "%I":
                case "%k":
                case "%l":
                hr = parseInt(a[i], 10);
                break;

                case "%P":
                case "%p":
                if (/pm/i.test(a[i]) && hr < 12)
                    hr += 12;
                else if (/am/i.test(a[i]) && hr >= 12)
                    hr -= 12;
                break;

                case "%M":
                min = parseInt(a[i], 10);
                break;
            }
        }

        if (isNaN(y)) y = today.getFullYear();
        if (isNaN(m)) m = today.getMonth();
        if (isNaN(d)) d = today.getDate();
        if (isNaN(hr)) hr = today.getHours();
        if (isNaN(min)) min = today.getMinutes();
        if (y != 0 && m != -1 && d != 0)
            return new Date(y, m, d, hr, min, 0);

        y = 0; m = -1; d = 0;
        for (i = 0; i < a.length; ++i) {
            if (a[i].search(/[a-zA-Z]+/) != -1) {
                var t = -1;
                for (j = 0; j < 12; ++j) {
                    if (locale._MN[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { t = j; break; }
                }
                if (t != -1) {
                    if (m != -1) {
                        d = m+1;
                    }
                    m = t;
                }
            } else if (parseInt(a[i], 10) <= 12 && m == -1) {
                m = a[i]-1;
            } else if (parseInt(a[i], 10) > 31 && y == 0) {
                y = parseInt(a[i], 10);
                (y < 100) && (y += (y > 29) ? 1900 : 2000);
            } else if (d == 0) {
                d = a[i];
            }
        }
        if (y == 0)
            y = today.getFullYear();
        if (m != -1 && d != 0)
            return new Date(y, m, d, hr, min, 0);
        return today;
    }
});

Object.extend(Date.prototype, {
    getMonthDays: function(month) {
        var year = this.getFullYear();
        if (typeof month == "undefined") {
            month = this.getMonth();
        }
        if (((0 == (year%4)) && ( (0 != (year%100)) || (0 == (year%400)))) && month == 1) {
            return 29;
        } else {
            return Date._MD[month];
        }
    },

    getDayOfYear: function() {
        var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
        var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
        var time = now - then;
        return Math.floor(time / Date.DAY);
    },

    getWeekNumber: function() {
        var d = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
        var DoW = d.getDay();
        d.setDate(d.getDate() - (DoW + 6) % 7 + 3); // Nearest Thu
        var ms = d.valueOf(); // GMT
        d.setMonth(0);
        d.setDate(4); // Thu in Week 1
        return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
    },

    equalsTo: function(date) {
        return ((this.getFullYear() == date.getFullYear()) &&
            (this.getMonth() == date.getMonth()) &&
            (this.getDate() == date.getDate()) &&
            (this.getHours() == date.getHours()) &&
            (this.getMinutes() == date.getMinutes()));
    },

    setDateOnly: function(date) {
        var tmp = new Date(date);
        this.setDate(1);
        this.setFullYear(tmp.getFullYear());
        this.setMonth(tmp.getMonth());
        this.setDate(tmp.getDate());
    },

    print: function (str, locale) {
        locale = locale || Date.locale;

        var m = this.getMonth();
        var d = this.getDate();
        var y = this.getFullYear();
        var wn = this.getWeekNumber();
        var w = this.getDay();
        var s = {};
        var hr = this.getHours();
        var pm = (hr >= 12);
        var ir = (pm) ? (hr - 12) : hr;
        var dy = this.getDayOfYear();
        if (ir == 0)
            ir = 12;
        var min = this.getMinutes();
        var sec = this.getSeconds();
        s["%a"] = locale._SDN[w]; // abbreviated weekday name [FIXME: I18N]
        s["%A"] = locale._DN[w]; // full weekday name
        s["%b"] = locale._SMN[m]; // abbreviated month name [FIXME: I18N]
        s["%B"] = locale._MN[m]; // full month name
        // FIXME: %c : preferred date and time representation for the current locale
        s["%C"] = 1 + Math.floor(y / 100); // the century number
        s["%d"] = (d < 10) ? ("0" + d) : d; // the day of the month (range 01 to 31)
        s["%e"] = d; // the day of the month (range 1 to 31)
        // FIXME: %D : american date style: %m/%d/%y
        // FIXME: %E, %F, %G, %g, %h (man strftime)
        s["%H"] = (hr < 10) ? ("0" + hr) : hr; // hour, range 00 to 23 (24h format)
        s["%I"] = (ir < 10) ? ("0" + ir) : ir; // hour, range 01 to 12 (12h format)
        s["%j"] = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy; // day of the year (range 001 to 366)
        s["%k"] = hr;       // hour, range 0 to 23 (24h format)
        s["%l"] = ir;       // hour, range 1 to 12 (12h format)
        s["%m"] = (m < 9) ? ("0" + (1+m)) : (1+m); // month, range 01 to 12
        s["%M"] = (min < 10) ? ("0" + min) : min; // minute, range 00 to 59
        s["%n"] = "\n";     // a newline character
        s["%p"] = pm ? "PM" : "AM";
        s["%P"] = pm ? "pm" : "am";
        // FIXME: %r : the time in am/pm notation %I:%M:%S %p
        // FIXME: %R : the time in 24-hour notation %H:%M
        s["%s"] = Math.floor(this.getTime() / 1000);
        s["%S"] = (sec < 10) ? ("0" + sec) : sec; // seconds, range 00 to 59
        s["%t"] = "\t";     // a tab character
        // FIXME: %T : the time in 24-hour notation (%H:%M:%S)
        s["%U"] = s["%W"] = s["%V"] = (wn < 10) ? ("0" + wn) : wn;
        s["%u"] = w + 1;    // the day of the week (range 1 to 7, 1 = MON)
        s["%w"] = w;        // the day of the week (range 0 to 6, 0 = SUN)
        // FIXME: %x : preferred date representation for the current locale without the time
        // FIXME: %X : preferred time representation for the current locale without the date
        s["%y"] = ('' + y).substr(2, 2); // year without the century (range 00 to 99)
        s["%Y"] = y;        // year with the century
        s["%%"] = "%";      // a literal '%' character

        var re = /%./g;
          
        if (!(/msie 5\.0/i.test(navigator.userAgent)) && !(Prototype.Browser.Gecko))
            return str.replace(re, function (par) { return s[par] || par; });

        var a = str.match(re);
        for (var i = 0; i < a.length; i++) {
            var tmp = s[a[i]];
            if (tmp) {
                re = new RegExp(a[i], 'g');
                str = str.replace(re, tmp);
            }
        }

        return str;
    }
});

Date.locale = Date.locales.en;