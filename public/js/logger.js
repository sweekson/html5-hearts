define(["events", "options", "util", "board", "game"], function(events, options, util, board, game){
  const games = [];
  const records = [];
  const previous = { game: null, round: null, trick: null, scores: null };
  const current = { game: null, round: null, trick: null, scores: null };
  const ui = {
    $games: $('<div class="logs-list">'),
    $records: $('<div class="logs-list">'),
    $rounds: $('<div class="logs-list">'),
    $hands: $('<div>'),
    $tricks: $('<tbody>'),
    $score: $('<tfoot>'),
  };
  const selected = { game: null, $game: null, round: null, $round: null, $trick: null };
  const suits = {
    fullname: {
      H: 'hearts',
      D: 'diamonds',
      S: 'spades',
      C: 'clubs',
    },
    entities: {
      H: '&hearts;',
      D: '&diams;',
      S: '&spades;',
      C: '&clubs;',
    }
  };

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
    this.played = [];
    this.isHeartBroken = false;
  }

  function Voids () {
    this.spades = false;
    this.hearts = false;
    this.diamonds = false;
    this.clubs = false;
  }

  Voids.prototype.update = function (cards) {
    this.spades = !cards.some(([val, suit]) => suit === 'S');
    this.hearts = !cards.some(([val, suit]) => suit === 'H');
    this.diamonds = !cards.some(([val, suit]) => suit === 'D');
    this.clubs = !cards.some(([val, suit]) => suit === 'C');
  };

  function Hand (id, pass, receive) {
    this.id = id;
    this.score = 0;
    this.cards = [];
    this.valid = [];
    this.current = [];
    this.played = [];
    this.voids = new Voids();
    this.pass = pass;
    this.receive = receive;
    this.canFollowLead = false;
  }

  function Pass (data) {
    this.to = data.to;
    this.cards = data.cards.map(card);
  }

  function Receive (data) {
    this.from = data.from;
    this.cards = data.cards.map(card);
  }

  function Trick (lead, leadCard) {
    this.lead = lead;
    this.leadCard = leadCard;
    this.leadSuit = leadCard[1];
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

  function renderSections ($container) {
    $container.empty();
    $container.append(
      $('<div class="logs-row col-xs-6">').append($('<div class="logs-title">').text('Games'), ui.$games),
      $('<div class="logs-row col-xs-6" hidden>').append($('<div class="logs-title">').text('Imported Games'), ui.$records),
      $('<div class="logs-row col-xs-12">').append($('<div class="logs-title">').text('Rounds'), ui.$rounds),
      $('<div class="col-xs-12">').append(
        $('<div class="logs-title">').text('Detail'),
        ui.$hands,
        $('<div>').append($('<table class="table-logs table-selectable">').append(ui.$tricks, ui.$score)),
      ),
    );
  }

  function renderGameItem (index, data) {
    const $item = $('<span class="logs-item">');
    $item.text(index + 1).click(e => {
      selected.$game.removeClass('selected');
      $item.addClass('selected');
      selected.game = data;
      selected.$game = $item;
      selected.round = data.rounds[0];
      renderRoundItems();
      renderDetail(selected.round);
    });
    selected.game === data && $item.addClass('selected') && (selected.$game = $item);
    return $item;
  }

  function renderNewGame (index, game) {
    ui.$games.append(renderGameItem(index, game));
  }

  function renderGames () {
    ui.$games.empty();
    games.forEach((v, i) => ui.$games.append(renderGameItem(i, v)));
  }

  function renderGameRecords () {
    ui.$records.empty();
    ui.$records.parent().prop('hidden', false);
    records.forEach((v, i) => ui.$records.append(renderGameItem(i, v)));
  }

  function renderRoundItem (id, data) {
    const $item = $('<span class="logs-item">');
    $item.text(id).click(e => {
      selected.$round.removeClass('selected');
      $item.addClass('selected');
      selected.round = data;
      selected.$round = $item;
      renderHands(data.hands);
      renderTricks(data);
      renderRoundScore(data);
    });
    if (selected.round === data) {
      $item.addClass('selected');
      selected.$round && selected.$round.removeClass('selected');
      selected.$round = $item;
    }
    return $item;
  }

  function renderNewRoundItem (index, round) {
    ui.$rounds.append(renderRoundItem(index + 1, round));
    renderTricks(round);
    renderRoundScore(round);
  }

  function renderRoundItems () {
    ui.$rounds.empty();
    selected.game.rounds.forEach((v, i) => ui.$rounds.append(renderRoundItem(i + 1, v)));
  }

  function renderCard (suit, number) {
    const $card = $('<span class="poker-card poker-card-xs">').addClass(suits.fullname[suit]);
    return $card.append(
      $('<span class="poker-card-number">').text(number),
      $('<span class="poker-card-suit">').html(suits.entities[suit]),
    );
  }

  function renderNumbers (suit, numbers, played) {
    if (options.visualize()) {
      return numbers.map(v => {
        const $card = renderCard(suit, v);
        played.indexOf(`${v}${suit}`) > -1 && $card.addClass('card-played');
        return $card;
      });
    }
    return numbers.map(v => {
      const $card = $('<span class="card-number">').text(v);
      played.indexOf(`${v}${suit}`) > -1 && $card.addClass('card-played');
      return $card;
    });
  }

  function renderHands (hands, tricks) {
    const $table = $('<table class="table-logs">');
    const $head = $('<tr>');
    const $spades = $('<tr>');
    const $hearts = $('<tr>');
    const $diamonds = $('<tr>');
    const $clubs = $('<tr>');
    const cards = { spades: [], hhearts: [], diamonds: [], clubs: []};
    const played = [];

    tricks && tricks.forEach(v => played.push(...v.cards.map(v => v.card)));

    $head.append('<th>');
    $spades.append('<td>S</td>');
    $hearts.append('<td>H</td>');
    $diamonds.append('<td>D</td>');
    $clubs.append('<td>C</td>');

    $table.append(
      $('<thead>').append($head),
      $('<tbody>').append($spades, $hearts, $diamonds, $clubs),
    );

    hands.forEach(player => {
      cards.spades = [];
      cards.hearts = [];
      cards.diamonds = [];
      cards.clubs = [];
      $head.append($('<th>').append(player.id));
      player.cards.forEach(([number, suit]) => {
        suit === 'S' && cards.spades.push(number);
        suit === 'H' && cards.hearts.push(number);
        suit === 'D' && cards.diamonds.push(number);
        suit === 'C' && cards.clubs.push(number);
      });
      $spades.append($('<td class="hand-spades">').append(renderNumbers('S', cards.spades, played)));
      $hearts.append($('<td class="hand-hearts">').append(renderNumbers('H', cards.hearts, played)));
      $diamonds.append($('<td class="hand-diamonds">').append(renderNumbers('D', cards.diamonds, played)));
      $clubs.append($('<td class="hand-clubs">').append(renderNumbers('C', cards.clubs, played)));
    });

    ui.$hands.empty().append($table);
  }

  function renderPlayedCard (player, card, trick) {
    const $cell = $('<td>');
    const $card = options.visualize() ? renderCard(card[1], card[0]) : $('<span class="trick-card">').text(card);
    const $score = $('<span class="trick-score">').text(trick.score >= 0 ? `(+${trick.score})` : `(${trick.score})`);
    $cell.append($card);
    card === 'TC' && $card.addClass('card-special');
    player.id === trick.lead && $cell.addClass('trick-lead');
    player.id === trick.won && $cell.addClass('trick-won');
    player.id === trick.won && $cell.append($score);
    return $cell;
  }

  function renderTrick (index, trick, round) {
    const $row = $('<tr>').append($('<td>').text(index + 1));
    const played = new Map();
    round.isHeartBroken !== trick.isHeartBroken && $row.addClass('heart-broken');
    round.isHeartBroken = trick.isHeartBroken;
    trick.cards.forEach(v => played.set(v.player, v.card));
    round.hands.forEach(v => $row.append(renderPlayedCard(v, played.get(v.id), trick)));
    $row.click(e => {
      selected.$trick && selected.$trick.removeClass('selected');
      selected.$trick !== $row && $row.addClass('selected');
      selected.$trick = null;
      $row.hasClass('selected') && (selected.$trick = $row);
      selected.$trick && renderHands(selected.round.hands, selected.round.tricks.slice(0, index));
      !selected.$trick && renderHands(selected.round.hands);
    });
    ui.$tricks.append($row);
  }

  function renderTricks (round) {
    ui.$tricks.empty();
    if (!round.tricks.length) { return; }
    round.isHeartBroken = false;
    round.tricks.forEach((v, i) => renderTrick(i, v, round));
  }

  function renderRoundScore (round) {
    ui.$score.empty();
    if (!round.tricks.length) { return; }
    const $row = $('<tr>').append($('<td>'));
    round.hands.forEach(v => $row.append($('<td>').text(v.score)));
    ui.$score.append($row);
  }

  function renderDetail (round) {
    renderHands(round.hands);
    renderTricks(round);
    renderRoundScore(round);
  }

  return {
    init ($container) {
      renderSections($container);
      util.enableAutoScroll($container.get(0), { bottomBound: 60 });

      events.on('game-start', e => {
        current.game = new Game();
        games.push(current.game);
        !selected.game && (selected.game = current.game);
        renderNewGame(games.indexOf(current.game), current.game);
        console.log(e, current);
      });

      events.on('round-start', e => {
        current.game.players = e.detail.players.map(v => new Player(v.id, v.getName(), v.id));
        current.round = new Round(e.detail.rounds);
        current.scores = new Map();
        current.game.rounds.push(current.round);
        current.game.players.forEach(v => current.scores.set(v.id, 0));
        selected.round = current.round;
        current.game === selected.game && renderNewRoundItem(current.game.rounds.indexOf(current.round), current.round);
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
        (e.detail.rounds % 4 === 0 || !options.passing()) && e.detail.players.forEach(v => current.round.hands.push(new Hand(v.id)));
        e.detail.players.forEach(v => players.set(v.id, v));
        current.round.hands.forEach(v => {
          v.cards = players.get(v.id).row.cards.map(card);
          v.current = v.cards.slice(0);
          v.voids.update(v.current);
        });
        current.round === selected.round && renderHands(current.round.hands);
        console.log(e, current);
      });

      events.on('trick-playing', e => {
        const hand = current.round.hands.find(v => v.id === e.detail.player.id);
        current.round.hands.forEach(v => v.voids.update(v.current));
        hand.valid = e.detail.valid.map(card);
        hand.canFollowLead = !current.trick ? true : hand.valid.some(([rank, suit]) => suit === current.trick.leadSuit);
        hand.voids.update(hand.current);
        console.log(e, current);
      });

      events.on('trick-played', e => {
        const hand = current.round.hands.find(v => v.id === e.detail.player.id);
        const played = card(e.detail.card);
        if (e.detail.played === 0) {
          current.trick = new Trick(e.detail.player.id, played);
        }
        current.trick.cards.push(new PlayedCard(e.detail.player.id, played));
        hand.played.push(played);
        hand.current.splice(hand.current.indexOf(played), 1);
        hand.voids.update(hand.current);
        current.round.played.push(played);
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
        current.round === selected.round && renderTrick(current.round.tricks.indexOf(current.trick), current.trick, current.round);
        current.round === selected.round && renderRoundScore(current.round);
        previous.trick = current.trick;
        current.trick = null;
        console.log(e, current);
      });

      events.on('round-end', e => {
        const scores = new Map();
        const players = e.detail.players;
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore()));
        current.round.hands.forEach((v, i) => {
          if (!previous.round) {
            v.score = scores.get(v.id);
          } else {
            v.score = scores.get(v.id) - previous.round.hands[i].score;
          }
        });
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore()));
        current.game.players.forEach(v => v.score = scores.get(v.id));
        current.round === selected.round && renderRoundScore(current.round);
        previous.round = current.round;
        previous.scores = current.scores;
        current.round = null;
        current.scores = null;
        console.log(e, current);
      });

      events.on('game-over', e => {
        const players = e.detail.players.sort((a, b) => a.getScore() - b.getScore());
        const minimum = players[0].getScore();
        const winners = players.filter(v => v.getScore() === minimum);
        current.game.winners = winners.map(v => v.id);
        previous.game = current.game;
        current.game = null;
        console.log(e, current);
      });
    },
    download () {
      const data = JSON.stringify(games, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      return URL.createObjectURL(blob);
    },
    import (file) {
      const reader = new FileReader();
      reader.onload = e => {
        records.push(...JSON.parse(e.target.result));
        renderGameRecords();
      };
      reader.readAsText(file);
    },
    replay () {
      const deck = [];
      const cards = Array(52).fill('');
      cards.forEach((v, i) => cards[i] = card({ num: i % 13 + 1, suit: i % 4 }));
      selected.round.hands.forEach(v => v.cards.forEach((c, i) => deck[v.id + i * 4] = cards.indexOf(c)));
      board.cards.forEach((v, i) => v.display.dom.css({
        transform: `rotateY(180deg) translate3d(-${i * .25}px, ${i * .25}px, 0)`,
        zIndex: 51 - i
      }));
      board.setDeck(deck);
      game.replay();
    },
    get current () { return current; },
    get previous () { return previous; },
    get games () { return games; },
  };
});