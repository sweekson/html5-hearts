define(['layout'],
function(layout){
    var Waste = function(id, player){
        this.id = id;
        this.isVertical = id % 2;
        this.rotation = 90 * ((id + 1) % 4) -90;
        this.cards = [];
        this.playedBy = player;
    };

    Waste.prototype.adjustPos = function(){
        if(this.isVertical){
            this.distance = layout.width / 2 + layout.rowMargin + layout.cardHeight / 2;
        }else{
            this.distance = layout.height / 2 + layout.rowMargin + layout.cardHeight / 2;
        }
        this.cards.forEach(function(c){
            c.adjustPos();
        });
    };

    Waste.prototype.getPosFor = function(ind){
        var pos = {
            x: 0,
            y: this.distance,
            rotation: this.rotation,
            z: ind + 52,
            rotateY: 0
        };
        return pos;
    };

    Waste.prototype.addCards = function(cards){
        const findTC = v => v.suit === 2 && v.num === 9;
        const hadTC = this.cards.find(findTC) != null;
        const hasTC = cards.find(findTC) != null;
        const multiply = hadTC || hasTC ? 2 : 1;
        hasTC && this.playedBy.setScore(this.playedBy.getScore() * 2);
        this.playedBy.incrementScore(multiply * cards.reduce(function(s, c){
            if (c.suit === 1) { return s - 1; }
            if (c.suit === 0 && c.num === 11) { return s - 13; }
            return s;
        }, 0));
        var finalCard;
        for(var i = 0; i < cards.length; i++){
            if(cards[i].pos.rotation === this.rotation){
                cards[i].pos.z = 104;
                finalCard = cards[i];
            }else{
                cards[i].pos.rotation = this.rotation;
                this.addCard(cards[i]);
            }
            cards[i].adjustPos(true);
        }
        this.addCard(finalCard);
        var self = this;
        setTimeout(function(){
            self.adjustPos();
        }, 300);
    };

    Waste.prototype.addCard = function(card){
        card.parent = this;
        card.ind = this.cards.length;
        this.cards.push(card);
    };

    return Waste;
});
