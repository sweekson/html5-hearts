require({
    baseUrl: 'js',
    paths: {
        jquery: 'lib/jquery-2.0.3.min'
    }
},
        ["game", "jquery", "domBinding", "layout", "config", "logger", "options"],
function(game,    $,        domBinding,   layout,   config,   logger,   options){
    "use strict";

    logger.init($('#game-logs').addClass(options.logs() ? 'in' : ''));

    layout.region = $('#game-region')[0];
    layout.adjust();

    domBinding.fragmentToDom($('#game-region')[0]);
    game.adjustLayout();

    $(window).resize(function(){
        layout.adjust();
        game.adjustLayout();
    });

    var nums = ['one', 'two', 'three', 'four'];
    $('#control-region>button').on("click", function(){
        $('#control-region')[0].hidden = true;
    });
    $('#control-region>.newgame-but').on("click", function(){
        config.names.forEach(function(n, ind){
            config.levels[ind] = $('.player-diff.' + nums[ind] + ' input').val();
            config.names[ind] = $('.player-set-name.' + nums[ind]).text();
        });
        config.sync();
    });
    $('.newgame-but').on("click", function(){
        if(confirm("This will end the current game. Are you sure?")){
            game.newGame();
        }
    });
    $('#settings-but').on("click", function(){
        $('#settings-dialog')[0].hidden = false;
        config.names.forEach(function(n,ind){
            $('.player-set-name.' + nums[ind])[0].innerHTML = n;
            $('.player-diff.' + nums[ind] + ' input').val(parseInt(config.levels[ind]));
            console.log(parseInt(config.levels[ind]));
        });
        $('#control-region')[0].hidden = false;
    });
    $('#logs-btn').on("click", function(){
        $('#game-logs').toggleClass('in');
        layout.adjust();
        game.adjustLayout();
    });
    $('#export-logs-btn').on("click", function(e){
        e.target.href = logger.download();
        e.target.download = 'games.json';
    });
    game.newGame();
});