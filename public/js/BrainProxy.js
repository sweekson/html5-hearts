define(['Brain', 'ScoreLessBot', 'HeartsBotC0', 'logger'], function (Brain, ScoreLessBot, HeartsBotC0, logger) {
  'use strict';

  const Bots = { ScoreLessBot, HeartsBotC0 };

  function toCardValue (data) {
    const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['S', 'H', 'C', 'D'];
    return numbers[data.num - 1] + suits[data.suit];
  }

  function BrainProxy (user, options) {
    Brain.call(this, user);
    this.options = options;
    this.bot = new Bots[options.bot]();
  };

  BrainProxy.prototype = Object.create(Brain.prototype);

  BrainProxy.prototype.passCards = function () {

  };

  BrainProxy.prototype.exposeCards = function () {

  };

  BrainProxy.prototype.decide = function (validCards, boardCards, boardPlayers, scores) {
    const { match, game, deal, round } = logger.current;
    const detail = { match };
    const hand = deal.hands.get(this.user.id);
    const picked = this.bot.pick({ detail, match, game, deal, hand, round });
    const card = validCards.find(v => toCardValue(v) === (picked.value || picked));
    return $.Deferred().resolve(card.ind);
  };

  return BrainProxy;
});