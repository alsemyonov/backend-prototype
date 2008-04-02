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
 *      <div><a href="#" class="serviceRemoveLink">Remove block</a></div>
 *   </div>
 * </div>
 *
 * __n__ constuction is replaced by unique block id.
 * __[id]__ constructions are replaced by increase() argument object properties.
 * Block MUST have id like config.id + '__n__'.
 * serviceRemoveLink is in-block selector to automatic attach block deletion event.
 *
 * @config {string} id Block id.
 * @config {template} Template id.
 * @config {container} Container id.
 */
Backend.Behavior.Cloneable = Class.create({
  initialize: function(config) {    
    this.setDefaults({
      id: null,
      template: null,
      container: null
    });
    this.addEvents(['increase']);
    this.configure(config);
    this.count = 0;
  },
  increaseClick: function(e) {
    e.stop();
    this.increase();
  },
  removeClick: function(e, n) {
    e.stop();
    this.remove(n);
  },
  increase: function(args) {
    args = args || {};
    var n = this.count++;
    Object.extend(args, {n: n});
    var service = $(this.config.template).evaluate(args);
    $(this.config.container).insert(service);
    $(this.config.id+n).select('.'+this.config.id+'RemoveLink').invoke('observe', 'click', this.removeClick.bindAsEventListener(this, n));
    this.fire('increase', this, n);
  },
  remove: function(n) {
    $(this.config.id+n).remove();
  },
  removeAll: function() {
    $(this.config.container).update('');
    this.count = 0;
  }
}, Backend.Configurable, Backend.Observable);
