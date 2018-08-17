define(["events"], function(events){
  const records = [];
  const current = { record: null, round: null };

  function Record (table) {
    this.table = table || 0;
    this.winners = [];
    this.players = [];
    this.rounds = [];
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
    this.tircks = [];
  }

  function Pass (to, cards) {
    this.to = to;
    this.cards = cards;
  }

  function Receive (from, cards) {
    this.from = from;
    this.cards = cards;
  }

  function Hand (id) {
    this.id = id;
    this.score = 0;
    this.cards = [];
  }

  function Trick () {

  }

  function card (data) {
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
    const suits = ['S', 'H', 'C', 'D'];
    return numbers[data.num] + suits[data.suit];
  }

  return {
    init () {
      events.on('prepare', e => current.record = new Record());

      events.on('start', e => {
        current.record.players = e.detail.players.map(v => new Player(v.id, v.getName(), v.id));
        current.round = new Round(e.detail.rounds);
        console.log(e, current);
      });

      events.on('passing', e => {
        e.detail.transfer.forEach(v => {
          current.round.push(new Hand(v.id))
        });
        console.log(e);
      });

      events.on('confirming', e => {

      });

      events.on('playing', e => {

      });

      events.on('over', e => {
        const players = e.detail.players.sort((a, b) => a.getScore() - b.getScore());
        const minimum = players[0].getScore();
        const winners = players.filter(v => v.getScore() === minimum);
        // current.record.players.forEach(v => v.score = );
        current.record.winners = winners.map(v => v.getName());
        records.push(current.record);
        current.record = null;
      });
    },
  };
});