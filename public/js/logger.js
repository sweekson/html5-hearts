define(["events"], function(events){
  const games = [];
  const current = { game: null, round: null, trick: null, scores: null };

  function Game (table) {
    this.table = table || 0;
    this.winners = [];
    this.players = [];
    this.rounds = [];
    this.ts = Date.now();
  }

  function Player (id, name, position) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.score = 0;
  }

  function Round (round) {
    this.round = round;
    this.hands = [];
    this.tricks = [];
  }

  function Hand (id, pass, receive) {
    this.id = id;
    this.score = 0;
    this.cards = [];
    this.pass = pass;
    this.receive = receive;
  }

  function Pass (data) {
    this.to = data.to;
    this.cards = data.cards.map(card);
  }

  function Receive (data) {
    this.from = data.from;
    this.cards = data.cards.map(card);
  }

  function Trick (lead) {
    this.lead = lead;
    this.won = null;
    this.score = 0;
    this.cards = [];
    this.isHeartBroken = false;
  }

  function PlayedCard (player, card) {
    this.player = player;
    this.card = card;
  }

  function card (data) {
    const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['S', 'H', 'C', 'D'];
    return numbers[data.num - 1] + suits[data.suit];
  }

  return {
    init () {
      events.on('game-start', e => {
        current.game = new Game();
        console.log(e, current);
      });

      events.on('round-start', e => {
        current.game.players = e.detail.players.map(v => new Player(v.id, v.getName(), v.id));
        current.round = new Round(e.detail.rounds);
        current.scores = new Map();
        current.game.rounds.push(current.round);
        current.game.players.forEach(v => current.scores.set(v.id, 0));
        console.log(e, current);
      });

      events.on('round-passing', e => {
        e.detail.transfer.forEach(v => {
          current.round.hands.push(new Hand(v.id, new Pass(v.pass), new Receive(v.receive)));
        });
        console.log(e, current);
      });

      events.on('round-confirming', e => {
        const players = new Map();
        e.detail.rounds % 4 === 0 && current.round.hands.push(new Hand(v.id));
        e.detail.players.forEach(v => players.set(v.id, v));
        current.round.hands.forEach(v => v.cards = players.get(v.id).row.cards.map(card));
        console.log(e, current);
      });

      events.on('trick-playing', e => {
        if (e.detail.played === 0) {
          current.trick = new Trick(e.detail.player.id);
        }
        current.trick.cards.push(new PlayedCard(e.detail.player.id, card(e.detail.card)));
        console.log(e, current);
      });

      events.on('trick-end', e => {
        const id = e.detail.won.player.id;
        const score = e.detail.won.player.getScore();
        const players = e.detail.players;
        const scores = new Map();
        current.trick.won = id;
        current.trick.score = score - current.scores.get(id);
        current.trick.isHeartBroken = e.detail.heartBroken || false;
        current.scores.set(id, score);
        current.round.tricks.push(current.trick);
        players.forEach(v => scores.set(v.id, v.getScore()));
        current.round.hands.forEach(v => v.score = scores.get(v.id));
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore() + v.getScore()));
        current.game.players.forEach(v => v.score = scores.get(v.id));
        current.trick = null;
        console.log(e, current);
      });

      events.on('round-end', e => {
        const scores = new Map();
        const players = e.detail.players;
        players.forEach(v => scores.set(v.id, v.getScore()));
        current.round.hands.forEach(v => v.score = scores.get(v.id));
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore() + v.getScore()));
        current.game.players.forEach(v => v.score = scores.get(v.id));
        current.round = null;
        current.scores = null;
        console.log(e, current);
      });

      events.on('game-over', e => {
        const players = e.detail.players.sort((a, b) => a.getScore() - b.getScore());
        const minimum = players[0].getScore();
        const winners = players.filter(v => v.getScore() === minimum);
        current.game.winners = winners.map(v => v.id);
        games.push(current.game);
        current.game = null;
        console.log(e, current);
      });
    },
  };
});