define(function () {
  class HeartsClientBase {
    constructor (options) {
      this.options = options;
      this.middlewares = [];
      this.initialize();
    }

    initialize () {
      (this.options.middlewares || []).forEach(v => this.use(v));
    }

    pick (dealNumber, roundNumber, turnCard) {
      this.send('pick_card', { dealNumber, roundNumber, turnCard });
    }

    expose (dealNumber, cards) {
      this.send('expose_my_cards', { dealNumber, cards });
    }

    pass (dealNumber, cards) {
      this.send('pass_my_cards', { dealNumber, cards });
    }

    join () {
      const { playerNumber, playerName } = this.options;
      this.send('join', { playerNumber, playerName });
    }

    notify (method, detail) {
      this.middlewares.forEach(v => v[method](detail));
    }

    use (Middleware) {
      this.middlewares.push(new Middleware(this));
    }

    send (eventName, data) {

    }
  }

  return HeartsClientBase;
});