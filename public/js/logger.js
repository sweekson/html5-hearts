define(["events", "options", "util", "board", "hears-models"], function(events, options, util, board, models){
  const { Match, Game, Player, Deal, Cards, Card, PlayedCard, Hand, Pass, Round } = models;
  const match = new Match();
  const records = [];
  const previous = { game: null, deal: null, round: null, scores: null };
  const current = { match, game: null, deal: null, round: null, scores: null };
  const ui = {
    $games: $('<div class="logs-list">'),
    $records: $('<div class="logs-list">'),
    $deals: $('<div class="logs-list">'),
    $hands: $('<div>'),
    $rounds: $('<tbody>'),
    $score: $('<tfoot>'),
  };
  const selected = { game: null, $game: null, deal: null, $deal: null, $round: null };
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
    },
    ranks: {
      2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
      T: 10, J: 11, Q: 12, K: 13, A: 14
    }
  };

  function toCardValue (data) {
    const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['S', 'H', 'C', 'D'];
    return numbers[data.num - 1] + suits[data.suit];
  }

  function renderSections ($container) {
    $container.empty();
    $container.append(
      $('<div class="logs-row col-xs-6">').append($('<div class="logs-title">').text('Games'), ui.$games),
      $('<div class="logs-row col-xs-6" hidden>').append($('<div class="logs-title">').text('Imported Games'), ui.$records),
      $('<div class="logs-row col-xs-12">').append($('<div class="logs-title">').text('Deals'), ui.$deals),
      $('<div class="col-xs-12">').append(
        $('<div class="logs-title">').text('Detail'),
        ui.$hands,
        $('<div>').append($('<table class="table-logs table-selectable">').append(ui.$rounds, ui.$score)),
      ),
    );
  }

  function renderGameItem (game) {
    const $item = $('<span class="logs-item">');
    $item.text(game.number).click(e => {
      selected.$game.removeClass('selected');
      $item.addClass('selected');
      selected.game = game;
      selected.$game = $item;
      selected.deal = game.deals.first;
      renderDealItems();
      renderDetail(selected.deal);
    });
    selected.game === game && $item.addClass('selected') && (selected.$game = $item);
    return $item;
  }

  function renderNewGame (game) {
    ui.$games.append(renderGameItem(game));
  }

  function renderGames () {
    ui.$games.empty();
    match.games.each((v, i) => ui.$games.append(renderGameItem(i, v)));
  }

  function renderGameRecords () {
    ui.$records.empty();
    ui.$records.parent().prop('hidden', false);
    records.forEach(v => ui.$records.append(renderGameItem(v)));
  }

  function renderDealItem (deal) {
    const $item = $('<span class="logs-item">');
    $item.text(deal.number).click(e => {
      selected.$deal.removeClass('selected');
      $item.addClass('selected');
      selected.deal = deal;
      selected.$deal = $item;
      renderHands(deal.hands);
      renderRounds(deal);
      renderDealScore(deal);
    });
    if (selected.deal === deal) {
      $item.addClass('selected');
      selected.$deal && selected.$deal.removeClass('selected');
      selected.$deal = $item;
    }
    return $item;
  }

  function renderNewDealItem (deal) {
    ui.$deals.append(renderDealItem(deal));
    renderRounds(deal);
    renderDealScore(deal);
  }

  function renderDealItems () {
    ui.$deals.empty();
    selected.game.deals.each((v, i) => ui.$deals.append(renderDealItem(v)));
  }

  function renderCard (card) {
    const $card = $('<span class="poker-card poker-card-xs">').addClass(suits.fullname[card.suit]);
    return $card.append(
      $('<span class="poker-card-number">').text(card.rank),
      $('<span class="poker-card-suit">').html(suits.entities[card.suit]),
    );
  }

  function renderSuitCards (cards, played) {
    if (options.visualize()) {
      return cards.map(v => {
        const $card = renderCard(v);
        played.contains(v.value) && $card.addClass('card-played');
        return $card;
      });
    }
    return cards.map(v => {
      const $card = $('<span class="card-number">').text(v.rank);
      played.contains(v.value) && $card.addClass('card-played');
      return $card;
    });
  }

  function renderHands (hands, rounds) {
    const $table = $('<table class="table-logs">');
    const $head = $('<tr>');
    const $spades = $('<tr>');
    const $hearts = $('<tr>');
    const $diamonds = $('<tr>');
    const $clubs = $('<tr>');
    const played = new Cards();

    rounds && rounds.forEach(v => played.push(...v.played.list));

    $head.append('<th>');
    $spades.append('<td>S</td>');
    $hearts.append('<td>H</td>');
    $diamonds.append('<td>D</td>');
    $clubs.append('<td>C</td>');

    $table.append(
      $('<thead>').append($head),
      $('<tbody>').append($spades, $hearts, $diamonds, $clubs),
    );

    hands.each(hand => {
      $head.append($('<th>').append(hand.player));
      $spades.append($('<td class="hand-spades">').append(renderSuitCards(hand.cards.spades.list, played)));
      $hearts.append($('<td class="hand-hearts">').append(renderSuitCards(hand.cards.hearts.list, played)));
      $diamonds.append($('<td class="hand-diamonds">').append(renderSuitCards(hand.cards.diamonds.list, played)));
      $clubs.append($('<td class="hand-clubs">').append(renderSuitCards(hand.cards.clubs.list, played)));
    });

    ui.$hands.empty().append($table);
  }

  function renderPlayedCard (player, card, round) {
    const $cell = $('<td>');
    const $card = options.visualize() ? renderCard(card) : $('<span class="trick-card">').text(card);
    const $score = $('<span class="trick-score">').text(round.score >= 0 ? `(+${round.score})` : `(${round.score})`);
    $cell.append($card);
    card === 'TC' && $card.addClass('card-special');
    player === round.lead.player && $cell.addClass('trick-lead');
    player === round.won.player && $cell.addClass('trick-won');
    player === round.won.player && $cell.append($score);
    return $cell;
  }

  function renderRound (round, deal, index) {
    const $row = $('<tr>').append($('<td>').text(round.number));
    deal.isHeartBroken !== round.isHeartBroken && $row.addClass('heart-broken');
    deal.isHeartBroken = round.isHeartBroken;
    deal.hands.each(v => $row.append(renderPlayedCard(v.player, round.played.get(v.player), round)));
    $row.click(e => {
      selected.$round && selected.$round.removeClass('selected');
      selected.$round !== $row && $row.addClass('selected');
      selected.$round = null;
      $row.hasClass('selected') && (selected.$round = $row);
      selected.$round && renderHands(selected.deal.hands, selected.deal.rounds.list.slice(0, index));
      !selected.$round && renderHands(selected.deal.hands);
    });
    ui.$rounds.append($row);
  }

  function renderRounds (deal) {
    ui.$rounds.empty();
    if (!deal.rounds.length) { return; }
    deal.isHeartBroken = false;
    deal.rounds.each((v, i) => renderRound(v, deal, i));
  }

  function renderDealScore (deal) {
    ui.$score.empty();
    if (!deal.rounds.length) { return; }
    const $row = $('<tr>').append($('<td>'));
    deal.hands.each(v => $row.append($('<td>').text(v.score)));
    ui.$score.append($row);
  }

  function renderDetail (deal) {
    renderHands(deal.hands);
    renderRounds(deal);
    renderDealScore(deal);
  }

  return {
    init ($container) {
      renderSections($container);
      util.enableAutoScroll($container.get(0), { bottomBound: 60 });

      events.on('game-start', e => {
        match.self = 0;
        current.game = new Game(match.games.length + 1);
        match.games.add(current.game.number, current.game);
        !selected.game && (selected.game = current.game);
        current.game.isFirst && e.detail.players.forEach(v => match.players.add(
          v.id,
          new Player(v.id, v.getName())
        ));
        renderNewGame(current.game);
        console.log(e, current);
      });

      events.on('deal-start', e => {
        const game = current.game;
        const deal = current.deal = new Deal(e.detail.rounds);
        e.detail.players.forEach(v => {
          const hand = new Hand(v.id);
          hand.cards.push(...v.row.cards.map(v => new Card(toCardValue(v))));
          deal.hands.add(v.id, hand);
        });
        current.scores = new Map();
        game.deals.push(deal);
        match.players.each(v => current.scores.set(v.number, 0));
        selected.deal = deal;
        game === selected.game && renderNewDealItem(deal);
        console.log(e, current);
      });

      events.on('deal-passing', e => {
        e.detail.transfer.forEach(v => {
          const hand = current.deal.hands.get(v.id);
          hand.pass = new Pass(v.pass.to, new Cards(v.pass.cards.map(toCardValue)));
          hand.receive = new Pass(v.receive.from, new Cards(v.receive.cards.map(toCardValue)));
        });
        console.log(e, current);
      });

      events.on('deal-confirming', e => {
        const deal = current.deal;
        e.detail.players.forEach(v => {
          const hand = deal.hands.get(v.id);
          hand.voids.update(hand.current);
        });
        deal === selected.deal && renderHands(deal.hands);
        console.log(e, current);
      });

      events.on('round-playing', e => {
        const deal = current.deal;
        const round = current.round;
        const hand = deal.hands.get(e.detail.player.id);
        e.detail.played === 0 && (current.round = new Round(deal.rounds.length + 1));
        deal.hands.each(v => v.voids.update(v.current));
        hand.valid.clear();
        hand.valid.push(...Cards.create(e.detail.valid.map(toCardValue)));
        hand.voids.update(hand.current);
        hand.canFollowLead = !round ? true : hand.valid.list.some(v => v.suit === round.lead.suit);
        console.log(e, current);
      });

      events.on('round-played', e => {
        const deal = current.deal;
        const round = current.round;
        const player = e.detail.player.id;
        const hand = deal.hands.get(player);
        const played = new PlayedCard(e.detail.player.id, toCardValue(e.detail.card));
        round.played.add(player, played);
        round.played.length === 1 && (round.lead = played);
        hand.played.push(new Card(toCardValue(e.detail.card)));
        hand.voids.update(hand.current);
        deal.played.push(played);
        played.suit !== round.lead.suit && (hand.voids[round.lead.fullsuit] = true);
        console.log(e, current);
      });

      events.on('round-end', e => {
        const deal = current.deal;
        const round = current.round;
        const player = e.detail.won.player.id;
        const hand = deal.hands.get(player);
        const score = e.detail.won.player.getScore();
        const players = e.detail.players;
        const scores = new Map();
        hand.gained.push(...round.played.penalties);
        round.won = round.played.get(player);
        round.score = score - current.scores.get(player);
        round.isHeartBroken = e.detail.heartBroken || false;
        current.scores.set(player, score);
        deal.rounds.push(round);
        players.forEach(v => scores.set(v.id, v.getScore()));
        deal.hands.each(v => v.score = scores.get(v.player));
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore() + v.getScore()));
        match.players.each(v => v.score = scores.get(v.player));
        deal === selected.deal && renderRound(round, deal);
        deal === selected.deal && renderDealScore(deal);
        previous.round = round;
        current.round = null;
        console.log(e, current);
      });

      events.on('deal-end', e => {
        const deal = current.deal;
        const scores = new Map();
        const players = e.detail.players;
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore()));
        deal.hands.each(v => {
          v.score = !previous.deal ? scores.get(v.player) : scores.get(v.player) - previous.deal.hands.get(v.player).score;
        });
        players.forEach(v => scores.set(v.id, v.getAccumulatedScore()));
        match.players.each(v => v.score = scores.get(v.number));
        deal === selected.deal && renderDealScore(deal);
        previous.deal = deal;
        previous.scores = current.scores;
        current.deal = null;
        current.scores = null;
        console.log(e, current);
      });

      events.on('game-over', e => {
        const players = e.detail.players.sort((a, b) => a.getScore() - b.getScore());
        const minimum = players[0].getScore();
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
        const data = JSON.parse(e.target.result);
        const games = data.match.games.map(v => {
          const game = new Game(v.number);
          game.deals.push(...v.deals.map(v => {
            const deal = new Deal(v.number);
            deal.isHeartBroken = false;
            deal.hands.push(...v.hands.map(v => {
              const hand = new Hand(v.player);
              hand.score = v.score;
              hand.hadShotTheMoon = v.hadShotTheMoon;
              hand.exposed.push(...Cards.create(v.exposed));
              hand.cards.push(...Cards.create(v.cards));
              v.pass && hand.cards.discard(...v.pass.cards).push(...Cards.create(v.receive.cards)).sort();
              hand.played.push(...Cards.create(v.played));
              hand.gained.push(...Cards.create(v.gained));
              v.pass && (hand.pass = new Pass(v.pass.player, new Cards(v.pass.cards)));
              v.receive && (hand.receive = new Pass(v.receive.player, new Cards(v.receive.cards)));
              return hand;
            }));
            deal.rounds.push(...v.rounds.map(v => {
              const round = new Round(v.number);
              round.lead = new PlayedCard(v.lead.player, v.lead.card);
              round.won = new PlayedCard(v.won.player, v.won.card);
              round.score = v.score;
              round.isHeartBroken = v.isHeartBroken;
              v.played.forEach(v => round.played.add(v.player, new PlayedCard(v.player, v.card)));
              return round;
            }));
            return deal;
          }));
          return game;
        });
        records.push(...games);
        renderGameRecords();
      };
      reader.readAsText(file);
    },
    replay () {
      const deck = [];
      const cards = Array(52).fill('');
      cards.forEach((v, i) => cards[i] = toCardValue({ num: i % 13 + 1, suit: i % 4 }));
      selected.deal.hands.each((v, i) => {
        v.cards.each((c, k) => deck[i + k * 4] = cards.indexOf(c.value));
      });
      board.cards.forEach((v, i) => v.display.dom.css({
        transform: `rotateY(180deg) translate3d(-${i * .25}px, ${i * .25}px, 0)`,
        zIndex: 51 - i
      }));
      board.setDeck(deck);
    },
    get current () { return current; },
    get previous () { return previous; },
    get games () { return games; },
  };
});