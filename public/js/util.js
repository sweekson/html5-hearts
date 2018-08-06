define(function(){
  var $ = function(query){
      return document.querySelectorAll(query);
  };

  var vendorPrefix = (function(){
      if(window.isDebug) return "";
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'],
          tran = "Transform";

      var el = document.createElement('div');

      for (var i=0; i<prefixes.length; ++i) {
        var vendorTran = prefixes[i] + tran;
        if (vendorTran in el.style){
          return prefixes[i];
        }
    }
  })();

  return {
    $: $,
    vendorPrefix: vendorPrefix
  };
});