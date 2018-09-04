define(["util"], function(util){
  function bot (pattern) {
    const type = util.search(pattern, 1);
    const name = util.search(pattern, 2);
    return type ? { type: Number(type), name } : { type: 0 };
  }

  return {
    brains () {
      const brains = util.search(/brains=(-?\d,\d,\d,\d)/, 1);
      return brains ? brains.split(',').map(Number) : null;
    },
    bot1 () {
      return bot(/bot1=(\d)-(\w+)/);
    },
    bot2 () {
      return bot(/bot2=(\d)-(\w+)/);
    },
    bot3 () {
      return bot(/bot3=(\d)-(\w+)/);
    },
    cheat () {
      return util.search(/cheat=(yes)/, 1) === 'yes';
    },
    replay () {
      return util.search(/replay=(\d+)/, 1) || -1;
    },
    passing () {
      return util.search(/passing=(no)/, 1) !== 'no';
    },
    dir () {
      const val = util.search(/pass-dir=(left|right|opposite)/, 1);
      const dirs = { left: 1, right: 2, opposite: 3 };
      return !val ? null : dirs[val];
    },
    logs () {
      return util.search(/logs=(on)/, 1) === 'on';
    },
    visualize () {
      return util.search(/visualize=(on)/, 1) === 'on';
    },
  };
});