import http from 'http';
import socketIO from 'socket.io';
import faker from 'faker';

import AppController from './app';

interface EstablishSessionData {
  studentName: string;
}

interface MessageData {
  text: string;
}

// Handles communication to/from frontend via websockets
class SocketController {

  controller: AppController;

  io: SocketIO.Server;

  constructor (controller: AppController) {
    this.controller = controller;
  }

  attachToServer(server: http.Server) {
    this.io = socketIO(server);
    this.initEventListeners();
  }

  initEventListeners() {
    // listen to messages sent from frontend, call appropriate method on appcontroller 

    this.io.on('connection', socket => {

      this.sendChannelList(socket.id);

      socket.on('send_message', async ({ text }: MessageData, cb: any) => {
        await this.controller.handleMessageFromClient({
          message: text,
          socketId: socket.id
        });
        if (cb) cb();
      });

      socket.on('establish_session', (data: EstablishSessionData, cb: any) => {
        this.controller.establishSession({
          name: data.studentName,
          socketId: socket.id
        }); //
        if(cb) cb();
      });

      socket.on('disconnect', () => {
        this.controller.dropSession(socket.id);
      });


      const tutor = faker.name.firstName();
      setInterval(() => {
        socket.emit('message', {
          text: faker.lorem.sentences(3),
          name: tutor
        });
      }, 5000);
  
    })
  }

  async sendChannelList (socketId: string) {
    const channels = this.controller.getChannels();
    const socket = this.io.sockets.sockets[socketId];

    if (socket) {
      socket.emit('channel_list', channels);
    }
  }

  async sendMessage () {
    
  }
}

export default SocketController;