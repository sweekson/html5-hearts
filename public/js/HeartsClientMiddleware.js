define(['util', 'hears-models'], function (util, models) {
  const {
    Match, Game, Player, Deal, Hand,
    Cards, Card, PlayedCard, Pass, Round
  } = models;

  class HeartsClientMiddleware {
    constructor (client) {
      this.client = client;
      this.bot = client.options.bot;
      this.detail = {};
      this.detail.match = new Match();
      this.match = this.detail.match;
      this.game = null;
      this.deal = null;
      this.hand = null;
      this.round = null;
      this.events = [];
      this.actions = [];
      this.candidates = [];
    }

    onNewGame (data) {
      const match = this.match;
      const game = this.game = new Game(data.gameNumber);
      match.games.add(game.number, game);
      data.players.forEach((v, i) => match.players.add(
        v.playerNumber,
        new Player(v.playerNumber, v.playerName, i + 1)
      ));
    }

    onNewDeal (data) {
      const match = this.match;
      const deal = this.deal = new Deal(data.dealNumber);
      data.self && (match.self = data.self.playerNumber);
      data.players.forEach(({ playerNumber: number, isHuman }) => {
        match.players.merge(number, { isHuman });
        deal.hands.add(number, new Hand(number));
        number === match.self && (this.hand = deal.hands.get(number));
      });
      match.self && this.hand.cards.push(...Cards.create(data.self.cards)).sort();
      this.game.deals.add(deal.number, deal);
    }

    onPassCards () {
      const cards = this.bot.pass(this);
      const payload = this.client.pass(this.deal.number, cards);
      this.actions.push(payload);
    }

    onPassCardsEnd (data) {
      if (!this.match.self) { return; }
      const match = this.match;
      const game = this.game;
      const deal = this.deal;
      const hand = this.hand;
      const { pickedCards, receivedCards } = data.players.find(v => v.playerNumber === match.self);
      const player = match.players.get(match.self);
      const to = game.getPassToPlayer(deal.number, player.position);
      const toPlayer = match.players.find(v => v.position === to);
      const from = game.getPassFromPlayer(deal.number, player.position);
      const fromPlayer = match.players.find(v => v.position === from);
      hand.pass = new Pass(toPlayer.number, Cards.instanciate(pickedCards));
      hand.receive = new Pass(fromPlayer.number, Cards.instanciate(receivedCards));
      hand.cards.sort();
    }

    onExposeCards () {
      const cards = this.bot.expose(this);
      const payload = this.client.expose(this.deal.number, cards);
      this.actions.push(payload);
    }

    onExposeCardsEnd (data) {
      const deal = this.deal;
      data.players.forEach(({ playerNumber: number, exposedCards }) => {
        const hand = deal.hands.get(number);
        const exposed = Cards.create(exposedCards, number);
        hand.exposed.push(...exposed);
        deal.exposed.push(...exposed);
      });
    }

    onNewRound (data) {
      this.deal.rounds.push(this.round = new Round(data.roundNumber));
    }

    onTurnEnd (data) {
      const deal = this.deal;
      const round = this.round;
      const player = this.match.players.find(v => v.name === data.turnPlayer);
      const played = new PlayedCard(player.number, data.turnCard);
      const hand = deal.hands.get(player.number);
      hand.played.push(new Card(data.turnCard));
      round.played.add(player.number, played);
      deal.played.push(played);
      round.played.length === 1 && (round.lead = played);
      played.suit !== round.lead.suit && (hand.voids[round.lead.fullsuit] = true);
      deal.isHeartBroken = round.isHeartBroken = deal.isHeartBroken || played.isHeart;
      this.bot.watch(player, played);
    }

    onYourTurn (data) {
      const hand = this.hand;
      const round = this.round;
      hand.valid.clear();
      hand.valid.push(...Cards.create(data.self.candidateCards));
      hand.voids.update(hand.current);
      hand.canFollowLead = !round.lead ? true : hand.valid.list.some(v => v.suit === round.lead.suit);

      this.candidates.push({ round: round.number, cards: hand.valid.values });
      const card = this.bot.pick(this);
      const payload = this.client.pick(this.deal.number, this.round.number, card);
      this.actions.push(payload);
    }

    onRoundEnd (data) {
      const round = this.round;
      const player = this.match.players.find(v => v.name === data.roundPlayer);
      const hand = this.deal.hands.get(player.number);
      const isAceHeartExposed = this.deal.exposed.contains('AH');
      const hasTenClub = hand.gained.contains('TC');
      hand.gained.push(...round.played.penalties);
      round.won = new PlayedCard(player.number, hand.played.last.value);
      round.score = Cards.scoring(round.played, isAceHeartExposed) * (hasTenClub ? 2 : 1);
      hand.score = Cards.scoring(hand.gained, isAceHeartExposed);
      this.round = null;
    }

    onDealEnd (data) {
      const match = this.match;
      const game = this.game;
      const deal = this.deal;
      const players = match.players;
      const hands = deal.hands;
      data.players.forEach(v => {
        const number = v.playerNumber;
        const hand = hands.get(number);
        players.get(number).score = v.gameScore;
        hand.hadShotTheMoon = v.shootingTheMoon;
        hand.valid.clear();

        if (number === match.self) { return; }

        hand.cards.push(...Cards.create(v.initialCards));

        if (deal.number <= 3) {
          const player = players.get(number);
          const to = game.getPassToPlayer(deal.number, player.position);
          const toPlayer = players.find(v => v.position === to);
          const from = game.getPassFromPlayer(deal.number, player.position);
          const fromPlayer = players.find(v => v.position === from);
          hand.pass = new Pass(toPlayer.number, Cards.instanciate(v.pickedCards));
          hand.receive = new Pass(fromPlayer.number, Cards.instanciate(v.receivedCards));
        }

        hand.cards.sort();
      });
      this.deal = null;
      this.hand = null;
    }

    onGameEnd () {
      this.game = null;
      this.deal = null;
      this.hand = null;
      this.round = null;
      this.export();
    }

    onGameStop () {
      this.export();
    }

    onMessage (detail) {
      const { eventName, data } = detail;
      const handler = 'on' + util.string.toUpperCamelCase(eventName);
      this.events.push(detail);
      this[handler] && this[handler](data);
    }

    onClose () {
    }

    onOpen (data) {
    }

    onError () {}

    export () {

    }
  }

  return HeartsClientMiddleware;
});