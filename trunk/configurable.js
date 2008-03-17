/*  Backend Prototype JavaScript enchanser, version 0.0.1
 *  (c) 2007 gzigzigzi
 *--------------------------------------------------------------------------*/

/*  
 * Configurable behaviour.
 *--------------------------------------------------------------------------*/
Backend.Configurable = {
  setDefaults: function(defaults) {
    this.defaults = this.defaults || {};
    this.defaults = Object.extend(defaults, this.defaults);
  },
  configure: function(config) {
    this.defaults = this.defaults || {};
    this.config = Object.extend(this.defaults, config);
  },
  getConfig: function() {
    return this.config;
  }
};
