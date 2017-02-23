var Chess = require('chess.js');

var chessSocket,
    game,
    board,
    statusEl,
    fenEl,
    pgnEl;

function updateStatus(){
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
    }

    // game still on
    else {
        status = moveColor + ' to move';

        // check?
        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    statusEl.html(status);
    fenEl.html(game.fen());
    pgnEl.html(game.pgn());
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
};

function onDrop(source, target) {
    // see if the move is legal

    var action = {
        type: 'move',
        data: {
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        }
    };
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    if(move === null){
        return 'snapback';
    }
    chessSocket.send(JSON.stringify(action));
};

function init(){
    var host = window.location.hostname + (!!window.location.port ? ':' + window.location.port : '');
    var wsPrefix = (window.location.protocol === 'https:' ? 'wss' : 'ws');
    chessSocket = new WebSocket(wsPrefix+"://"+host+"/chess", "protocolOne");
    game = new Chess();
    statusEl = $('#status');
    fenEl = $('#fen');
    pgnEl = $('#pgn');

    chessSocket.onopen = function (event) {
        chessSocket.send(JSON.stringify({type: 'connected'}));
    };

    chessSocket.onmessage = function(event){
        console.log('Received message', event);
        console.log(event.data);
        var action = JSON.parse(event.data);
        switch(action.type){
            case 'fen':
                console.log('Received fen action', action.fen);
                game.load(action.fen);
                board.position(action.fen);
                console.log('Board position is now ', board.position());
                break;
            default:
                console.log('Unknwn action', action.type);
        }
    }

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop
    };
    board = ChessBoard('board', cfg);
    board.position(game.fen());
    console.log('Initialized board');

    updateStatus();
    console.log(chessSocket.readyState);

    $(window).on('focus', function(){
        console.log('focus');
        // To make sure that chess is updated.
        setTimeout(function() {
            console.log('resizing');
            board.resize();
        }, 500);
    });

    $('#reset').on('click', function(){
        chessSocket.send(JSON.stringify({type: 'reset'}));
    });
}

module.exports = {
    init: init
};