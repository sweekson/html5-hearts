(function(){
    var game = window.game = {};

    var status = 'prepare',
        heartBroken = false,
        currentPlay = 0,
        players = [],
        rounds = -1,
        directions = ['left', 'right', 'opposite'],
        transferred = 0;

    game.players = players;

    var interface = game.interface = {
        arrow: window.isDebug ? null : document.createElement('div'),
        button: window.isDebug ? null : document.createElement('button'),
        message: window.isDebug ? null : document.createElement('div'),
        showMessage: function(msg){
            if(window.isDebug) {
                console.log(msg);
                return;
            }
            this.message.innerHTML = msg;
            this.message.style.display = 'block';
        },
        hideMessage: function(){
            if(window.isDebug) {
                return;
            }
            this.message.style.display = '';
        },
        playerBoards: [],
        endMessage: window.isDebug ? null : document.createElement('div')
    };

    var board = game.board = {
        cards: [],
        isEmpty: function(){
            return this.desk.cards.length === 0;
        },
        desk: {
            cards: [],
            players: [],
            getPosFor: function(ind){
                var pos = {
                    x: 0,
                    y: layout.cardHeight / 2 + layout.cardWidth / 2,
                    z: ind + 52
                };
                pos.rotation = this.cards[ind].pos.rotation;
                return pos;
            },
            addCard: function(card, applying){
                card.ind = this.cards.length;
                this.cards.push(card);
                if(!applying){
                    this.players.push(card.parent.playedBy);
                }
                card.parent = this;
                card.flip(false);
            },
            adjustPos: function(){
                this.cards.forEach(function(c){
                    c.adjustPos();
                });
            },
            score: function(){
                var max = 0;
                for(var i = 1; i < 4; i++){
                    if( this.cards[i].suit === this.cards[max].suit && (this.cards[i].num > this.cards[max].num)){
                        max = i;
                    }
                }
                var p = this.players[max],
                    self = this;
                var nextTime = 600,
                    time = 800;
                if(window.isDebug){
                    nextTime = 0;
                    time = 0;
                }
                setTimeout(function(){
                    currentPlay = p.id;
                    p.waste.addCards(self.cards);
                    self.players = [];
                    self.cards = [];
                    if(players[0].row.cards.length === 0){
                        setTimeout(function(){
                            end();
                        },nextTime);
                    }else{
                        setTimeout(function(){
                            proceed();
                        },nextTime);
                    }
                }, time);
            }
        }
    };

    var layout = game.layout = {
        width: 500,
        height: 500,
        cardSep: 30,
        cardHeight: 130,
        cardWidth: 85,
        rowMargin: 10,
        boardHeight: 55,
        boardWidth: 250,
        adjust: function(){
            if(window.isDebug) return;
            var region = $('#game-region')[0];
            this.width = region.offsetWidth;
            this.height = region.offsetHeight;
            players.forEach(function(r){
                r.row.adjustPos();
                r.waste.adjustPos();
            });
            board.desk.adjustPos();
        }
    };

    var proceed = game.proceed = function(){
        ({
            'prepare': function(){
                tester.informNewGame();
                if(!window.isDebug){
                    [].forEach.call($('.movable'), function(c){
                        c.classList.remove('movable');
                    });
                    interface.hideMessage();
                    interface.button.classList.remove('show');
                }
                rounds++;
                players.forEach(function(p){
                    p.initForNewRound();
                });
                board.desk.cards.length = 0;
                board.desk.players.length = 0;
                board.cards.forEach(function(c){
                    c.parent = null;
                    c.flip(true);
                });
                heartBroken = false;
                layout.adjust();
                function move(){
                    if(curI === board.cards.length){
                        players.forEach(function(v){v.row.sort();});
                        setTimeout(function(){
                            status = 'start';
                            proceed();
                        }, window.isDebug ? 0 : 300);
                        return;
                    }
                    players[curI % 4].row.addCard(board.cards[carddeck[curI]]);
                    players[curI % 4].row.adjustPos();
                    if(curI%4 === 0){
                        var pc = board.cards[carddeck[curI]];
                    }
                    curI++;
                    setTimeout(move, window.isDebug ? 0 : 10);
                }
                curI = 0;
                var carddeck=[];
                var i;
                for(i=0;i<52;i++) {
                    carddeck.push(i);
                }

                for(i = 0; i < 52; i++){
                    var ran=Math.floor(Math.random()*(52-i));
                    var tmp = carddeck[ran];
                    carddeck[ran]=carddeck[51-i];
                    carddeck[51 - i]=tmp;
                }
                if(!window.isDebug){
                    for(i = 51; i >= 0; i--){
                        var c = board.cards[carddeck[i]].display.style;
                        c.zIndex = 200 - i * 3;
                        c[vendorPrefix + 'Transform'] = 'translate3d(-' + (52-i)/4+'px,-' + (52-i)/4 + 'px, -' + i +'px) rotateY(180deg)';
                    }
                }
                setTimeout(function(){move();}, window.isDebug ? 0 : 300);
            },
            'start': function(){
                players.forEach(function(p){
                    p.prepareTransfer();
                });
                transferred = 0;
                if(window.isDebug){
                    status = 'passing';
                    currentPlay = 0;
                    proceed();
                }
            },
            'passing': function(){
                if(transferred === 4){
                    players.forEach(function(r){
                        r.row.sort();
                    });
                    if(window.isDebug){
                        status = "playing";
                        currentPlay = board.cards[26].parent.playedBy.id;
                        setTimeout(proceed, 0);
                    }else{
                        status = 'confirming';
                        players[0].myTurn();
                    }
                }else{
                    players[currentPlay].myTurn();
                }
            },
            'confirming': function(){
                if(!window.isDebug){
                    interface.button.classList.add('show');
                }
                players[0].row.curShifted = [];
                players[0].row.adjustPos();
                currentPlay = board.cards[26].parent.playedBy.id;
                setTimeout(function(){
                    status = 'playing';
                    proceed();
                }, window.isDebug ? 0 : 100);
            },
            'playing': function(){
                if(!window.isDebug){
                    interface.button.classList.remove('show');
                }
                if(board.desk.cards.length === 4){
                    board.desk.score();
                }else if(players[0].row.curShifted.length === 1){
                    interface.hideMessage();
                    var card = players[0].row.curShifted[0];
                    players[0].row.out(card.ind, true);
                    game.informCardOut(players[0], card);
                    players[0].next();
                }else{
                    players[currentPlay].myTurn();
                }
            },
            'allEnd': function(){
                if(!window.isDebug){
                    interface.playerboards.foreach(function(p){
                            p.display.style[vendorprefix + 'transform'] = "";
                    });
                   interface.endMessage.classList.remove('show');
                }
                players.forEach(function(p){
                    p.score = p.oldScore = 0;
                });
                rounds = -1;
                if(!window.isDebug){
                    interface.playerBoards.forEach(function(p){
                        p.hideFinal();
                        p.display.classList.remove('table');
                    });
                }
                newGame();
            },
            'end': function(){
                if(!window.isDebug){
                    interface.playerBoards.forEach(function(p){
                        p.hideFinal();
                        p.display.classList.remove('table');
                    });
                }
                newRound();
            }
        })[status]();
    };

    game.informCardOut = function(player, card){
        tester.log("place", player, card);
        players.forEach(function(p){
            p.watch({
                type: "out",
                player: player,
                card: card
            });
        });
    };

    game.init = function(){
        var frag;
        if(!window.isDebug){
            frag = document.createDocumentFragment();
        }
        var i;
        for(i=0;i<52;i++){
            var c = new Card(i);
            board.cards.push(c);
            if(!window.isDebug){
                frag.appendChild(c.display);
            }
        }
        for(i=0;i<4;i++){
            var b = new PlayerBoard(i);
            interface.playerBoards.push(b);
            if(!window.isDebug){
                frag.appendChild(b.display);
            }
        }
        if(!window.isDebug){
            interface.playerBoards[0].display.classList.add('human');
        }
        game.players = players = [
            window.isDebug ? new Ai(0) : new Human(0),
            new Ai(1),
            new Ai(2),
            new Ai(3)
        ];
        players.forEach(function(p, ind){
            p.name = config.names[ind];
        });

        if(!window.isDebug){
            interface.arrow.innerHTML = "&larr;";
            interface.arrow.id = 'pass-arrow';
            interface.arrow.onmouseup = function(){
                interface.hideMessage();
                status = 'passing';
                currentPlay = 0;
                players[0].transfer(players[0].row.curShifted);
                this.classList.remove('show');
            };

            interface.button.id = 'play-button';
            interface.button.onmouseup = function(){
                proceed();
                this.classList.remove('show');
            };

            interface.message.id = 'game-message';

            interface.endMessage.id = 'end-message';

            frag.appendChild(game.interface.arrow);
            frag.appendChild(game.interface.button);
            frag.appendChild(game.interface.message);
            frag.appendChild(game.interface.endMessage);

            $('#game-region')[0].appendChild(frag);
        }
    };

    var end = game.end = function(){
        if(players.some(function(p){
            return p.score === 26;
        })){
            players.forEach(function(p){
                if(p.score !== 26){
                    p.score = 26;
                }else{
                    p.score = 0;
                }
            });
        }
        tester.recordScore(players.map(function(p){
            return p.score;
        }));
        players.forEach(function(p){
            p.oldScore += p.score;
        });
        status = 'end';
        var rank = players.map(function(c){
            return c;
        });
        rank.sort(function(a,b){
            return a.oldScore - b.oldScore;
        });
        rank.forEach(function(r,ind){
            r.board.rank = ind;
        });
        layout.adjust();
        setTimeout(function(){
            if(!window.isDebug){
                interface.playerBoards.forEach(function(p){
                    p.showFinal();
                });
            }
            if(!window.isDebug){
                if(players.some(function(p){
                    return p.oldScore > 100;
                })){
                    if(players[0].board.rank === 0){
                        if(!window.isDebug){
                            interface.endMessage.innerHTML = 'You Won!';
                            interface.endMessage.style.color = 'white';
                            interface.endMessage.classList.add('show');
                        }
                    }else{
                        if(!window.isDebug){
                            interface.endmessage.innerhtml = 'you lost!';
                            interface.endmessage.style.color = 'grey';
                            interface.endMessage.classList.add('show');
                        }
                    }
                    status = 'allEnd';
                    if(!window.isDebug){
                        interface.playerBoards.forEach(function(p){
                            p.display.style[vendorPrefix + 'Transform'] =
                            'translate3d(0, -' + ((layout.boardHeight + 10) * 2 + 40) + 'px, 0)';
                        });
                    }
                }
            }
            if(!window.isDebug){
                interface.button.innerHTML = 'Continue';
                interface.button.classList.add('show');
            }else{
                setTimeout(proceed, 0);
            }
        }, window.isDebug ? 0 : 600);
    };

    var newRound = function(){
        status = 'prepare';
        proceed();
    };

    var newGame = game.newGame = function(){
        players.forEach(function(p){
            p.oldScore = 0;
        });
        rounds = 0;
        status = 'prepare';
        proceed();
    };

    game.load = function(){
        // game.state.apply();
        // players.forEach(function(p){
        //     p.score = p.waste.cards.reduce(function(p, c){
        //         if(c.suit === 1){
        //             return p + 1;
        //         }else if(c.suit === 0 && c.num === 11){
        //             return p + 13;
        //         }else{
        //             return p;
        //         }
        //     }, 0);
        // });
        // layout.adjust();
        // proceed();
    };

    game.getStatus = function(){
        return status;
    };

    game.setStatus = function(val){
        status = val;
    };

    game.getRounds = function(){
        return rounds;
    };

    game.nextPlayer = function(id){
        currentPlay = (id + 1) % 4;
    };

    game.isHeartBroken = function(){
        return heartBroken;
    };

    game.transfer = function(player, cards){
        tester.log("transfer", player, cards);
        transferred++;
        player.out(cards);
        var adds = [1, 3, 2];
        players[(player.id + adds[rounds % 3]) % 4].takeIn(cards);
        player.next();
        return (player.id + adds[rounds % 3]) % 4;
    };

    game.showPassingMsg = function(){
        if(!window.isDebug){
            interface.showMessage("Pass three cards to the " + directions[rounds % 3]);
            [function(){
                interface.arrow.style[vendorPrefix + 'Transform'] = 'rotate(0)';
            },function(){
                interface.arrow.style[vendorPrefix + 'Transform'] = 'rotate(180deg)';
            },function(){
                interface.arrow.style[vendorPrefix + 'Transform'] = 'rotate(90deg)';
            }][rounds % 3]();
        }
    };

    game.informHeartBroken = function(){
        heartBroken = true;
    };

    window.onresize = function(){
        layout.adjust();
    };
})();


// Object.defineProperty(this, 'score', {
//             get: function(){
//                 return this._score;
//             },
//             set: function(v){
//                 if(!window.isDebug){
//                     if(v > this._score){
//                         var b = this.board.scoretext.classList;
//                         b.add('highlight');
//                         setTimeout(function(){
//                             b.remove('highlight');
//                         },100);
//                     }
//                     if(game.getRounds() > 0){
//                         this.board.scoretext.innerHTML = this._oldScore + '+' + v;
//                     }else{
//                         this.board.scoretext.innerHTML = v;
//                     }
//                 }
//                 this._score = v;
//             }
//         });
//         Object.defineProperty(this, 'name', {
//             get: function(){
//                 return this._name;
//             },
//             set: function(v){
//                 this._name = v;
//                 if(!window.isDebug){
//                     this.board.nametext.innerHTML = v;
//                 }
//             }
//         });
//         Object.defineProperty(this, 'oldScore', {
//             get: function(){
//                 return this._oldScore;
//             },
//             set: function(v){
//                 this._oldScore = v;
//                 if(!window.isDebug){
//                     this.board.finaltext.innerHTML = v;
//                 }
//             }
//         });

// Row.prototype.adjustPos = function(){
//         if(this.isVertical){
//             this.distance = layout.width / 2 - layout.rowMargin - layout.cardHeight / 2;
//             this.playedBy.board.display.style.top = layout.height / 2 - layout.boardHeight / 2 + 'px';
//             if(this.id === 1){
//                 this.playedBy.board.display.style.left = layout.rowMargin * 1.5 + 'px';
//             }else{
//                 this.playedBy.board.display.style.left = layout.width - layout.rowMargin * 1.5 - layout.boardWidth + 'px';
//             }
//         }else{
//             this.distance = layout.height / 2 - layout.rowMargin - layout.cardHeight / 2;
//             this.playedBy.board.display.style.left = layout.width / 2 - layout.boardWidth / 2 + 'px';
//             if(this.id === 0){
//                 this.playedBy.board.display.style.top = layout.height - 30 - layout.rowMargin * 1.5 - layout.boardHeight - layout.cardHeight + 'px';
//             }else{
//                 this.playedBy.board.display.style.top = 30 + layout.rowMargin * 1.5 + 'px';
//             }
//         }
//         this.left = -((this.cards.length - 1) * layout.cardSep) / 2;
//         this.playedBy.board.display.classList.remove('table');
//         if(game.getStatus() === 'end'){
//             var top = layout.height / 2 - 2 * (layout.boardHeight + 10),
//                 left = layout.width / 2 - layout.boardWidth / 2;
//             var b = this.playedBy.board;
//             b.display.style.top = top + b.rank * (layout.boardHeight + 10) + 'px';
//             b.display.style.left = left + 'px';
//             b.display.classList.add('table');
//         }
//         this.cards.forEach(function(c){
//             c.adjustPos();
//         });
//     };