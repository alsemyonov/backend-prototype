/**
 * Behavior base class.
 * @class Backend.Behavior
 */
Backend.Behavior = Class.create({
  /**
   * @todo Test browsers.
   */
  initialize: function() {
    this.debug = false;
    if (Prototype.Browser.WebKit) {
      this.timer = setInterval(function() {
      if (/loaded|complete/.test(document.readyState)) {
        clearInterval(this.timer);
        delete this.timer;
        this.load();
      }}.bind(this), 10);
    } else if (Prototype.Browser.IE) {
      Event.observe(window, 'load', this._onLoad.bindAsEventListener(this));
    } else {
      Event.observe(document, 'DOMContentLoaded', this._onLoad.bindAsEventListener(this));
    }
  },

  /** Dumb function. 0.3? */
  _onLoad: function(e) {
    if (Prototype.Browser.IE) {
      this.load.bind(this).delay(0.3);
    } else {
      this.load.bind(this)();
    }
  },

  /**
   * Called when page is loaded.
   */
  load: function() {
  }
});

/**
 * Implements beahvior of clonable template block.
 * 
 * Example of template block:
 * <div id="exampleTemplate">
 *   <div id="example__n__">
 *      <div>__n__</div>
 *      <div><a href="#" class="__removeLink">Remove block</a></div>
 *   </div>
 * </div>
 *
 * __n__ constuction is replaced by unique block id.
 * __[id]__ constructions are replaced by increase() argument object properties.
 * Block MUST have id like config.id + '__n__'.
 * removeLink is block selector to automate attach block deletion event.
 *
 * @config {string} id Block id.
 * @config {template} Template id.
 * @config {container} Container id.
 * @todo 
 */
Backend.Behavior.Cloneable = Class.create({
  initialize: function(config) {    
    this.setDefaults({
      id: null,
      template: null,
      container: null
    });
    this.addEvents(['increase', 'remove']);
    this.configure(config);
    this.count = 0;
  },
  increaseClick: function(e) {
    this.increase();
    e.stop();    
  },
  decreaseClick: function(e, n) {
    this.decrease(n);
    e.stop();
  },
  increase: function(args) {
    args = args || {};
    var n = this.count++;
    args.n = n;
    var tpl = $(this.config.template).evaluate(args);
    $(this.config.container).insert(tpl);
    $(this.config.id+n).select('.__removeLink').invoke('observe', 'click', this.decreaseClick.bindAsEventListener(this, n));
    this.fire('increase', this, n);
  },
  increaseAll: function(n, args) {
    n.times
  },
  decrease: function(n) {
    this.fire('decrease', this, n);
    $(this.config.id+n).remove();
  },
  decreaseAll: function() {
    $(this.config.container).update('');
    this.count = 0;
  }
}, Backend.Configurable, Backend.Observable);
