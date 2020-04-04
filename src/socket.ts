import http from 'http';
import socketIO from 'socket.io';



import AppController from './app';

// Handles communication to/from frontend via websockets
class SocketController {

  controller: AppController;

  server: http.Server;
  io: SocketIO.Server;

  constructor (controller: AppController) {
    this.controller = controller;

    this.server = http.createServer();
    this.io = socketIO(this.server);

    this.initEventListeners();
  }

  initEventListeners() {
    // listen to messages sent from frontend, call appropriate method on appcontroller 

    this.io.on('connection', socket => {
      console.log('socket connected');
      console.log(socket.id);

      socket.on('send_message', message => {
        this.controller.handleMessageFromClient(message);
      })
    })
  }

  async start() {
    this.server.listen(3001);
  }

  async sendMessage () {
    
  }
}

export default SocketController;