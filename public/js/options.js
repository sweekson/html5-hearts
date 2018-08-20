define(["util"], function(util){
  return {
    brains () {
      const brains = util.search(/brains=(-?\d,\d,\d,\d)/, 1);
      return brains ? brains.split(',').map(Number) : null;
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
  };
});