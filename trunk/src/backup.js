/**
 * In-place editor.
 * @class Backend.Component.EditorDecorator
 */
/*Backend.Component.Decorator = Class.create(Backend.Component, {
  initialize: function($super, id, config) {
    this.setDefaults({
      decoration: id+'Decoration',
      decorator: id+'Decorator',
      container: id+'Container',
      switcherOn: id+'Switcher',
      switcherOff: id+'Switcher',
      redecorate: true,
      disable: false
    });
    $super(id, config);
  },
  render: function() {
    $(this.config.switcherOn).observe('click', function(e) {
      e.stop();
      this.switchToDecorator();
    }.bindAsEventListener(this));
    if (this.config.redecorate) { 
      $(this.config.switcherOff).observe('change', function(e) {
        e.stop();
        this.switchToDecoration();
      }.bindAsEventListener(this));
    }
  },
  switchToDecorator: function() {
    $(this.config.decoration).hide();
    $(this.config.decorator).show();
  },
  switchToDecoration: function(e) {
    $(this.config.decoration).show();
/*    var control = $(this.config.decorator);
    var value = undefined;
    
    if (control.tagName.toLowerCase() == 'select') {
      if (control.multiple == false) {
        value = control.options[control.selectedIndex].textContent;
      }
    }    
    if (control.tagName.toLowerCase() == 'input') {
      if (control.type.toLowerCase() == 'text') {
        value = update($(this.config.control).getValue());
      }
    }
    $(this.config.container).update(value);
    control.hide();
    if (this.config.disableHiddenControl) control.disable();
    $(this.config.decorator).hide();
  }    
});*/
