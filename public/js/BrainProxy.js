define(['Brain', 'ScoreLessBot', 'HeartsBotC0', 'logger', 'util'], function (Brain, ScoreLessBot, HeartsBotC0, logger, util) {
  'use strict';

  const Bots = { ScoreLessBot, HeartsBotC0 };

  function detail (uid) {
    const { match, game, deal, round } = logger.current;
    const detail = { match };
    const hand = deal.hands.get(uid);
    return { detail, match, game, deal, hand, round };
  }

  function BrainProxy (user, options) {
    Brain.call(this, user);
    this.options = options;
    this.bot = new Bots[options.bot]();
  };

  BrainProxy.prototype = Object.create(Brain.prototype);

  BrainProxy.prototype.passCards = function () {
    return this.bot.pass(detail(this.user.id));
  };

  BrainProxy.prototype.exposeCards = function () {
    return this.bot.expose(detail(this.user.id));
  };

  BrainProxy.prototype.decide = function (validCards, boardCards, boardPlayers, scores) {
    const picked = this.bot.pick(detail(this.user.id));
    const card = validCards.find(v => util.toCardValue(v) === (picked.value || picked));
    return $.Deferred().resolve(card.ind);
  };

  return BrainProxy;
});