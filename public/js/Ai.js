define(["Player", "jquery", "util"],
function(Player,  $,         util){
    "use strict";

    var Ai = function(id, name){
        Player.call(this, id, name);
    };

    Ai.prototype = Object.create(Player.prototype);

    Ai.prototype.fetchRandomCards = function (count) {
        var selected = [], cards = [];
        while (selected.length < count) {
            var index = Math.floor(Math.random() * this.row.cards.length);
            selected.indexOf(index) === -1 && selected.push(index);
        }
        for (var i = 0; i < count; i++) {
            cards.push(this.row.cards[selected[i]]);
        }
        return cards;
    };

    Ai.prototype.prepareTransfer = function(){
        this.selected = !this.brain.passCards ? this.fetchRandomCards(3) : this.brain.passCards().map(v => {
            return this.row.cards.find(c => util.toCardValue(c) === (v.value || v));
        });
        return $.Deferred().resolve();
    };

    Ai.prototype.confirmTransfer = function(){
        return this.brain.confirmCards();
    };

    Ai.prototype.transferTo = function(other){
        var selected = this.selected;
        Player.prototype.transferTo.call(this, other);
        this.brain.watch({
            type: "in",
            player: other,
            cards: selected
        });
    };

    Ai.prototype.fetchRandomExposeCards = function () {
        var random = Math.floor(Math.random() * 2);
        return random ? this.row.cards.filter(c => c.suit === 1 && c.num === 13) : [];
    };

    Ai.prototype.expose = function(){
        var cards = !this.brain.exposeCards ? this.fetchRandomExposeCards() : this.brain.exposeCards().map(v => {
            return this.row.cards.find(c => util.toCardValue(c) === (v.value || v));
        });
        return $.Deferred().resolve(cards);
    };

    Ai.prototype.watch = function(info){
        this.brain.watch(info);
    };

    Ai.prototype.decide = function(validCards, boardCards, boardPlayers, scores){
        return this.brain.decide(validCards, boardCards, boardPlayers, scores).then(function(c){
            return this.row.cards[c];
        }.bind(this));
    };

    return Ai;
});