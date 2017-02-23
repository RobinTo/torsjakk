var express = require('express');
var expressWs = require('express-ws')

var expressWs = expressWs(express());
var app = expressWs.app;


var Chess = require('chess.js').Chess;
var game = new Chess();

app.use(express.static('public'))

app.ws('/chess', function(ws, req) {
  ws.on('message', function(msg){
    console.log(arguments);
    let action = JSON.parse(msg);
    let myAction;
    switch(action.type){
      case 'move':
        game.move(action.data);
        myAction = JSON.stringify({type: 'fen', fen: game.fen()});
        messageClients(myAction);
        break;
      case 'connected':
        myAction = JSON.stringify({type: 'fen', fen: game.fen()});
        messageClients(myAction);
        break;
      case 'getposition':
        myAction = JSON.stringify({type: 'fen', fen: game.fen()});
        messageClients(myAction);
        break;
      case 'reset':
        game = new Chess();
        myAction = JSON.stringify({type: 'fen', fen: game.fen()});
        messageClients(myAction);
        break;
      default:
        break;
    }
  });
});

function messageClients(msg){
  aWss.clients.forEach(function (client) {
    client.send(msg);
  });
}
var aWss = expressWs.getWss('/chess');

app.listen(3000)
