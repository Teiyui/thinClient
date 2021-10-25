'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');

//socket.io
var socketIo = require('socket.io');

var log4js = require('log4js');
log4js.configure({
    appenders: {
        file: {
            type: 'file',
            filename: 'app.log',
            layout: {
                type: 'pattern',
                pattern: '%r %p - %m',
            }
        }
    },
    categories: {
       default: {
          appenders: ['file'],
          level: 'debug'
       }
    }
});

var logger = log4js.getLogger();

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var options = {
        key  : fs.readFileSync('./cert/youwzhen.com.key'),
        cert : fs.readFileSync('./cert/youwzhen.com.pem')
}

//http server
var http_server = http.createServer(app);
http_server.listen(8180, '0.0.0.0');

var https_server = https.createServer(options, app);
//bind socketio with https_server
var io = socketIo.listen(https_server);

//connection
io.sockets.on('connection', (socket)=>{
        socket.on('message', (room, data)=>{
                io.in(room).emit('message', room, socket.id, data)//Give info to all in room except yourself 
        });
        socket.on('join', (room)=> {
                   socket.join(room);
                   var myRoom = io.sockets.adapter.rooms[room];
                   var users = Object.keys(myRoom.sockets).length;
                   logger.log('the number of users in room is: ' + users);
                   socket.emit('joined', room, socket.id);
                   //socket.to(room).emit('joined', room, socket.id);
                   //io.in(room).emit('joined', room, socket.id);
                   //socket.broadcast.emit('joined', room, socket.id);
        });
        socket.on('leave', (room)=>{
                   var myRoom = io.sockets.adapter.rooms[room];
                   var users = Object.keys(myRoom.sockets).length;

                   logger.log('the number of users in room is: ' + (users-1));

                   socket.leave(room);
                   socket.emit('leave', room, socket.id);
                   //socket.to(room).emit('joined', room, socket.id);
                   //io.in(room).emit('joined', room, socket.id);
                   //socket.broadcast.emit('leave', room, socket.id);
        });
})
https_server.listen(443, '0.0.0.0');