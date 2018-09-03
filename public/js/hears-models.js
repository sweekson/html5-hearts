
define(['Collection'], function (Collection) {
  class Match {
    constructor () {
      this.games = new Collection();
      this.players = new Collection();
      this.self = 0;
    }
  }

  class Game {
    constructor (number) {
      this.number = number;
      this.deals = new Collection();
    }

    getPassToPlayer (dealNumber, playerNumber) {
      if (dealNumber === 4) { return playerNumber; }
      return [
        [2, 3, 4, 1],
        [4, 1, 2, 3],
        [3, 4, 1, 2],
      ][dealNumber - 1][playerNumber - 1];
    }

    getPassFromPlayer (dealNumber, playerNumber) {
      if (dealNumber === 4) { return playerNumber; }
      return [
        [4, 1, 2, 3],
        [2, 3, 4, 1],
        [3, 4, 1, 2],
      ][dealNumber - 1][playerNumber - 1];
    }

    get isFirst () {
      return this.number === 1;
    }
  }

  class Player {
    constructor (number, name) {
      this.number = number;
      this.name = name;
      this.score = 0;
      this.rank = 0;
      this.isHuman = false;
    }
  }

  class Deal {
    constructor (number) {
      this.number = number;
      this.hands = new Collection();
      this.rounds = new Collection();
      this.exposed = new Cards();
      this.played = new Cards();
      this.isHeartBroken = false;
    }
  }

  class Cards extends Collection {
    random () {
      const random = Math.floor(Math.random() * this.length);
      return this.list[random];
    }

    shuffle (times = 200) {
      const length = this.length;
      const list = this.list;
      let random1, random2, count = 0;
      while (count < times) {
        random1 = Math.floor(Math.random() * length);
        random2 = Math.floor(Math.random() * length);
        [list[random2], list[random1]] = [list[random1], list[random2]];
        ++count;
      }
      return this;
    }

    sort (ascending = true) {
      const l = this.length;
      const s = this.spades;
      const h = this.hearts;
      const d = this.diamonds;
      const c = this.clubs;
      const sorting = ascending ? (a, b) => a.number - b.number : (a, b) => b.number - a.number;
      if (s.length === l || h.length === l || d.length === l || c.length === l) {
        this.list.sort(sorting);
        return this;
      }
      s.sort(ascending);
      h.sort(ascending);
      d.sort(ascending);
      c.sort(ascending);
      this.clear();
      this.push(...s.list, ...h.list, ...c.list, ...d.list);
      return this;
    }

    ge (target) {
      const card = typeof target === 'string' ? new Card(target) : target;
      return new Cards(this.list.filter(v => v.ge(card)));
    }

    gt (target) {
      const card = typeof target === 'string' ? new Card(target) : target;
      return new Cards(this.list.filter(v => v.gt(card)));
    }

    le (target) {
      const card = typeof target === 'string' ? new Card(target) : target;
      return new Cards(this.list.filter(v => v.le(card)));
    }

    lt (target) {
      const card = typeof target === 'string' ? new Card(target) : target;
      return new Cards(this.list.filter(v => v.lt(card)));
    }

    skip (...items) {
      const cards = this.finds(...items);
      return new Cards(this.list.filter(v => cards.indexOf(v) === -1));
    }

    covers (...items) {
      const cards = items.map(v => typeof v === 'string' ? this.find(v) : v);
      return super.covers(...cards);
    }

    contains (...items) {
      const cards = items.map(v => typeof v === 'string' ? this.find(v) : v);
      return super.contains(...cards);
    }

    finds (...targets) {
      return targets.map(v => this.find(v)).filter(v => v !== undefined);
    }

    find (target) {
      if (typeof target === 'function') { return super.find(target); }
      if (typeof target === 'string') { return super.find(v => v.value === target); }
      return super.find(v => v === target);
    }

    discard (...values) {
      return super.discard(...this.finds(...values));
    }

    suit (suit) {
      return new Cards(this.list.filter(v => v.suit === suit));
    }

    get values () {
      return this.list.map(v => v.value);
    }

    get score () {
      return this.list.reduce((s, v) => s + v.score, 0);
    }

    get penalties () {
      return this.list.filter(v => v.isPenal);
    }

    get spades () {
      return new Cards(this.list.filter(v => v.isSpade));
    }

    get hearts () {
      return new Cards(this.list.filter(v => v.isHeart));
    }

    get diamonds () {
      return new Cards(this.list.filter(v => v.isDiamond));
    }

    get clubs () {
      return new Cards(this.list.filter(v => v.isClub));
    }

    get max () {
      return this.length ? new Cards(this.list).sort().last : undefined;
    }

    get min () {
      return this.length ? new Cards(this.list).sort().first : undefined;
    }
  }

  Cards.create = (values, player) => values.map(v => !player ? new Card(v) : new PlayedCard(player, v));
  Cards.instanciate = (values, player) => new Cards(Cards.create(values, player));
  Cards.scoring = (cards, isAceHeartExposed) => {
    const hearts = cards.hearts;
    const hasTenClub = cards.contains('TC');
    const hasQueenSpade = cards.contains('QS');
    const hadShotTheMoon = hearts.length === 13 && hasQueenSpade;
    const score1 = hearts.score * (isAceHeartExposed ? 2 : 1);
    const score2 = hasQueenSpade ? new Card('QS').score : 0;
    const score3 = score1 + score2;
    const score4 = score3 * (hasTenClub ? 2 : 1);
    const score5 = score4 * (hadShotTheMoon ? -4 : 1);
    return score5;
  };
  Cards.suits = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
  Cards.spades = ['2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', 'TS', 'JS', 'QS', 'KS', 'AS'];
  Cards.hearts = ['2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', 'TH', 'JH', 'QH', 'KH', 'AH'];
  Cards.diamonds = ['2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', 'TD', 'JD', 'QD', 'KD', 'AD'];
  Cards.clubs = ['2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', 'TC', 'JC', 'QC', 'KC', 'AC'];
  Cards.deck = [].concat(Cards.spades, Cards.hearts, Cards.diamonds, Cards.clubs);

  class Voids {
    constructor () {
      this.spades = false;
      this.hearts = false;
      this.diamonds = false;
      this.clubs = false;
    }

    update (cards) {
      this.spades = cards.spades.length === 0;
      this.hearts = cards.hearts.length === 0;
      this.diamonds = cards.diamonds.length === 0;
      this.clubs = cards.clubs.length === 0;
    }
  }

  class Hand {
    constructor (player) {
      this.player = player;
      this.score = 0;
      this.cards = new Cards();
      this.exposed = new Cards();
      this.played = new Cards();
      this.valid = new Cards();
      this.gained = new Cards();
      this.voids = new Voids();
      this.pass = null;
      this.receive = null;
      this.canFollowLead = false;
      this.hadShotTheMoon = false;
    }

    get current () {
      return this.cards.skip(...this.played.values);
    }
  }

  class Card {
    constructor (value) {
      this.value = value;
    }

    eq (card) {
      return this.number === card.number;
    }

    le (card) {
      return this.number <= card.number;
    }

    lt (card) {
      return this.number < card.number;
    }

    ge (card) {
      return this.number >= card.number;
    }

    gt (card) {
      return this.number > card.number;
    }

    is (value) {
      return this.value === value;
    }

    get score () {
      if (this.suit === 'H') { return -1; }
      if (this.value === 'QS') { return -13; }
      return 0;
    }

    get isSpade () {
      return this.suit === 'S';
    }

    get isHeart () {
      return this.suit === 'H';
    }

    get isDiamond () {
      return this.suit === 'D';
    }

    get isClub () {
      return this.suit === 'C';
    }

    get isPenal () {
      return this.suit === 'H' || this.value === 'QS' || this.value === 'TC';
    }

    get number () {
      return Card.numbers[this.rank];
    }

    get rank () {
      return this.value[0];
    }

    get fullsuit () {
      return Cards.suits[this.suit];
    }

    get suit () {
      return this.value[1];
    }

    toString () {
      return this.value;
    }

    toJSON () {
      return this.value;
    }
  }

  Card.numbers = {
    2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
    T: 10, J: 11, Q: 12, K: 13, A: 14
  };

  class PlayedCard extends Card {
    constructor (player, value) {
      super(value);
      this.player = player;
    }

    toJSON () {
      const player = this.player;
      const card = this.value;
      return { player, card };
    }
  }

  class Pass {
    constructor (player, cards) {
      this.player = player;
      this.cards = cards;
    }
  }

  class Round {
    constructor (number) {
      this.number = number;
      this.lead = null;
      this.won = null;
      this.score = 0;
      this.played = new Cards();
      this.isHeartBroken = false;
    }

    get hasPenaltyCard () {
      return this.played.list.some(v => v.isPenal);
    }

    get followed () {
      return this.lead ? this.played.suit(this.lead.suit) : new Cards();
    }

    get isLast () {
      return this.played.length === 3;
    }

    get isFirst () {
      return this.played.length === 0;
    }
  }

  return {
    Match, Game, Player, Deal, Hand, Round,
    Cards, Card, PlayedCard, Voids, Pass,
  };
});