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

  function search(regexp, index = 0) {
    const matches = location.search.match(regexp);
    if (!matches) { return null; }
    return matches[index];
  }

  function enableAutoScroll (node, options) {
    const config = { attributes: false, childList: true, subtree: true };
    const bottomBound = Number(options.bottomBound);
    const scrollToBottom = () => {
      const scrollTop = node.scrollTop;
      const clientHeight = node.clientHeight;
      const scrollHeight = node.scrollHeight;
      const shouldScroll = (scrollHeight - scrollTop - clientHeight) < bottomBound;
      shouldScroll && (node.scrollTop = scrollHeight);
    };
    const observer = new MutationObserver(_ => {
      bottomBound && scrollToBottom();
    });
    observer.observe(node, config);
  }

  function toCardValue (data) {
    const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['S', 'H', 'C', 'D'];
    return numbers[data.num - 1] + suits[data.suit];
  }

  return {
    $: $,
    vendorPrefix: vendorPrefix,
    search,
    enableAutoScroll,
    toCardValue,
  };
});