define(function(){
    "use strict";

    var arrow = document.createElement('div'),
        button = document.createElement('button'),
        message = document.createElement('div'),
        endMessage = document.createElement("div");

    button.id = 'play-button';
    message.id = 'game-message';
    arrow.innerHTML = "&larr;";
    arrow.id = 'pass-arrow';
    endMessage.id = "end-message";

    document.body.appendChild(arrow);
    document.body.appendChild(button);
    document.body.appendChild(message);
    document.body.appendChild(endMessage);

    return {
        clearEvents: function(){
            $(button).off("click");
            $(arrow).off("click");
        },
        showArrow: function(){
            arrow.classList.add('show');
        },
        hideArrow: function(){
            arrow.classList.remove('show');
        },
        showButton: function(text){
            button.innerHTML = text;
            button.classList.add('show');
            button.disabled = false;
            button.style.zIndex = 10;
        },
        hideButton: function(text){
            button.classList.remove('show');
            button.disabled = true;
            button.style.zIndex = 1;
        },
        arrowClickOnce: function(cb){
            $(arrow).on("click", function(){
                cb();
                $(this).off("click");
            });
        },
        buttonClickOnce: function(cb){
            $(button).on("click", function(){
                cb();
                $(this).off("click");
            });
        },
        showWin: function(won){
            endMessage.innerHTML = won ? "YOU WON!" : "YOU LOST!";
            endMessage.classList.add("show");
        },
        hideWin: function(){
            endMessage.classList.remove("show");
        },
        showMessage: function(msg){
            message.innerHTML = msg;
            message.style.display = 'block';
        },
        showPassingScreen: function(dir){
            var directions = ['left', 'right', 'opposite'];
            var rotates = ['rotate(0)', 'rotate(180deg)', 'rotate(90deg)'];
            this.showMessage("Pass three cards to the " + directions[dir - 1]);
            $(arrow).css("transform", rotates[dir - 1]);
        },
        hideMessage: function(){
            message.style.display = '';
        }
    };
});
