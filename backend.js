/*  Backend JavaScript library, version 0.0.2
 *  (c) 2007 roTuKa <rotuka@gmail.com>, gzigzigzi <gzigzigzi@gmail.com>
 *--------------------------------------------------------------------------*/

var Backend = {
  Version: '0.0.2',
  require: function(libraryName) {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="'+libraryName+'"></script>');
  },
  load: function() {
    if((typeof Prototype=='undefined') || 
       (typeof Element == 'undefined') || 
       (typeof Element.Methods=='undefined') ||
       parseFloat(Prototype.Version.split(".")[0] + "." +
                  Prototype.Version.split(".")[1]) < 1.6)
       throw("Backend requires the Prototype JavaScript framework >= 1.6.0");

    $A(document.getElementsByTagName("script")).findAll( function(s) {
      return (s.src && s.src.match(/backend\.js(\?.*)?$/))
    }).each( function(s) {
      var path = s.src.replace(/backend\.js(\?.*)?$/,'');
      var includes = s.src.match(/\?.*load=([a-z,]*)/);
      (includes ? includes[1] : 'date,prototype,ajax,observable,interface').split(',').each(
       function(include) { Backend.require(path+include+'.js') });
    });
  }
}

Backend.load();