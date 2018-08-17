define(function(){
  const hub = new EventTarget();

  return {
    on (...args) {
      hub.addEventListener(...args);
      return this;
    },
    trigger (type, detail) {
      hub.dispatchEvent(new CustomEvent(type, { detail }));
      return this;
    }
  };
});