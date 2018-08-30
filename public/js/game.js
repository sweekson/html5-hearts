define(["ui", "Human", "Ai", "board", "config", "jquery", "rules", "RandomBrain", "AsyncBrain", "SimpleBrain", "PomDPBrain", "options", "events"],
function(ui,   Human,   Ai,   board,   config,   $,        rules,   RandomBrain,   AsyncBrain,   SimpleBrain,   PomDPBrain,   options,   events){
    "use strict";

    var rounds = 0;
    var players = [
        new Human(0, config.names[0]),
        new Ai(1, config.names[1]),
        new Ai(2, config.names[2]),
        new Ai(3, config.names[3])
    ];

    var status = "prepare",
        currentPlay = 0,
        played = 0,
        replay = false;

    var exposed = [];
    var heartBroken = false;

    var nextTimer = 0;

    var waitDefer = function(time){
        var d = $.Deferred();
        setTimeout(function(){
            d.resolve();
        }, time);
        return d;
    };

    var initBrains = function(){
        // players[0].brain = new AsyncBrain(players[0], "PomDPBrain");

        if(players[1].brain){
            players[1].brain.terminate();
            players[2].brain.terminate();
            players[3].brain.terminate();
        }

        for(var i = 1; i < 4; i++){
            if(config.levels[i] == 1){
                players[i].brain = new SimpleBrain(players[i]);
            } else if(config.levels[i] == 2){
                players[i].brain = new AsyncBrain(players[i], "McBrain");
            } else if(config.levels[i] == 3){
                players[i].brain = new AsyncBrain(players[i], "PomDPBrain");
            } else if(config.levels[i] == 4){
                players[i].brain = new AsyncBrain(players[i], "PomDPBrain", {time: 2000});
            }
        }

        return $.when(players[1].brain.init(),
                      players[2].brain.init(),
                      players[3].brain.init());
    };

    var informCardOut = function(player, card){
        if(card.suit === 1){
            heartBroken = true;
        }
        players.forEach(function(p){
            p.watch({
                type: "out",
                player: player,
                card: card,
                curSuit: board.desk.cards[0].suit
            });
        });
    };

    var getPlayerForTransferTo = function(rounds, id){
        return (id + [2, 1, 3][rounds % 3]) % 4;
    };
    var getPlayerForTransferFrom = function(rounds, id){
        return (id + [2, 3, 1][rounds % 3]) % 4;
    };
    var shouldPassCards = _ => rounds % 4 !== 0;

    return {
        adjustLayout: function(){
            players.forEach(function(r){
                r.adjustPos();
            });
            board.desk.adjustPos();
        },
        newGame: function(){
            clearTimeout(nextTimer);
            ui.hideWin();
            players.forEach(function(p, i){
                p.clearScore();
                p.setActive(false);
                p.setName(config.names[i])
            });
            rounds = 0;
            ui.clearEvents();
            events.trigger('game-start', { players });
            status = 'prepare';
            this.proceed();
        },
        replay () {
            clearTimeout(nextTimer);
            ui.hideWin();
            ui.clearEvents();
            players.forEach(function(p, i){
                p.clearScore();
                p.setActive(false);
                p.setName(config.names[i]);
            });
            replay = true;
            rounds = 0;
            status = 'prepare';
            this.proceed();
            replay = false;
        },
        next: function(){
            if (status == 'confirming'){
                currentPlay = board.cards[26].parent.playedBy.id;
                played = 0;
            } else if (status == 'playing'){
                currentPlay = (currentPlay + 1) % 4;
                played++;
            }
            if(played == 4){
                status = 'endRound';
                played = 0;
            } else if (status == 'endRound' && players[0].row.cards.length === 0){
                status = 'end';
            } else {
                status = ({
                    'prepare': 'distribute',
                    'distribute': 'start',
                    'start': 'passing',
                    'passing': 'confirming',
                    'confirming': 'exposing',
                    'exposing': 'playing',
                    'playing': 'playing',
                    'endRound': 'playing',
                    'end': 'prepare'
                })[status];
            }
            var waitTime = {
                'playing': 100,
                'endRound': 900,
                'distribute': 300,
                'end': 900
            };
            var wait = waitTime[status] || 0;
            nextTimer = setTimeout(this.proceed.bind(this), wait);
        },
        proceed: function(){
            ({
                'prepare': function(){
                    ui.hideMessage();
                    ui.hideButton();
                    players.forEach(function(p){
                        p.initForNewRound();
                    });
                    board.init();
                    heartBroken = false;
                    (rounds === 0 || options.replay() < rounds) && !replay && board.shuffleDeck();
                    initBrains().done(this.next.bind(this));
                    events.trigger('round-prepare', { players });
                },
                'distribute': function(){
                    var self = this;
                    board.distribute(players).done(function(){
                        players.forEach(function(p){
                            p.row.sort();
                        });
                        events.trigger('round-distribute', { players });
                        self.next();
                    });
                },
                'start': function(){
                    rounds++;
                    events.trigger('round-start', { rounds, players });

                    if (!shouldPassCards() || !options.passing()) { return this.next(); }

                    $.when.apply($, players.map(function(p){
                        return p.prepareTransfer((options.dir() || rounds) % 4);
                    })).done(this.next.bind(this));
                },
                'passing': function(){
                    if (!shouldPassCards() || !options.passing()) { return this.next(); }

                    const dir = options.dir() || rounds;

                    events.trigger('round-passing', {
                        rounds,
                        players,
                        transfer: players.map((v, i) => {
                            const id = v.id;
                            const toPlayer = players[getPlayerForTransferTo(dir, i)];
                            const pass = { to: toPlayer.id, cards: v.selected };
                            const fromPlayer = players[getPlayerForTransferFrom(dir, i)];
                            const receive = { from: fromPlayer.id, cards: fromPlayer.selected };
                            return { id, pass, receive };
                        })
                    });
                    for(var i = 0; i < 4; i++){
                        players[i].transferTo(players[getPlayerForTransferTo(dir, i)]);
                    }
                    this.next();
                },
                'confirming': function(){
                    players.forEach(function(r){
                        r.row.sort();
                    });
                    events.trigger('round-confirming', { rounds, players });
                    $.when.apply($, players.map(function(p){
                        return p.confirmTransfer();
                    })).done(this.next.bind(this));
                },
                'exposing': function() {
                    const current = players.find(v => v.row.cards.find(c => c.suit === 1 && c.num === 13));
                    events.trigger('round-exposing', { rounds, players });
                    $.when(current.expose(), waitDefer(200)).done((cards) => {
                        exposed.push(...cards);
                        exposed.forEach(c => c.display.dom.addClass('exposed'));
                        this.next();
                    });
                },
                'playing': function(){
                    const current = players[currentPlay];
                    const valid = rules.getValidCards(
                        current.row.cards,
                        board.desk.cards[0] ? board.desk.cards[0].suit : -1,
                        heartBroken
                    );
                    current.setActive(true);
                    events.trigger('trick-playing', { rounds, played, player: current, valid });
                    $.when(current.decide(
                        valid,
                        board.desk.cards,
                        board.desk.players,
                        players.map(function(p){
                            return p.getScore();
                        })), waitDefer(200))
                    .done(function(card){
                        events.trigger('trick-played', { rounds, played, player: current, card });
                        current.setActive(false);
                        card.parent.out(card);
                        board.desk.addCard(card,current);
                        card.adjustPos();
                        informCardOut(current, card);
                        this.next();
                    }.bind(this));
                },
                'endRound': function(){
                    var info = board.desk.score();
                    currentPlay = info[0].id;
                    info[0].waste.addCards(info[1]);
                    events.trigger('trick-end', { rounds, players, won: { player: info[0], cards: info[1] }, heartBroken });
                    this.next();
                },
                'end': function(){
                    players.forEach(function(p){
                        p.finalizeScore();
                    });
                    var rank = players.map(function(c){
                        return c;
                    });
                    rank.sort(function(a,b){
                        return a._oldScore - b._oldScore;
                    });
                    rank.forEach(function(r,ind){
                        r.display.rank = ind;
                    });
                    players.forEach(function(p){
                        p.adjustPos();
                    });
                    events.trigger('round-end', { rounds, players });
                    if(rounds === 4){
                        players.forEach(function(p){
                            p.display.moveUp = true;
                            p.display.adjustPos();
                        });
                        ui.showWin(players[0] === rank[0]);
                        ui.showButton("Restart");
                        ui.buttonClickOnce(this.newGame.bind(this));
                        events.trigger('game-over', { players: rank });
                    } else {
                        ui.showButton("Continue");
                        ui.buttonClickOnce(this.next.bind(this));
                    }
                }
            })[status].bind(this)();
        }
    };
});