/*  
 * @class Backend.Configurable
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
