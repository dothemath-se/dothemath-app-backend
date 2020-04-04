import http from 'http';
import socketIO from 'socket.io';
import faker from 'faker';

import AppController from './app';

interface EstablishSessionData {
  studentName: string;
  channelId: string;
}

interface MessageData {
  text: string;
}

interface SendMessageOptions {
  socketId: string,
  text: string,
  sender: string
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
          text,
          socketId: socket.id
        });
        if (cb) cb();
      });

      socket.on('establish_session', ({studentName, channelId}: EstablishSessionData, cb: any) => {
        this.controller.establishSession({
          name: studentName,
          socketId: socket.id,
          channelId: channelId ? channelId : 'C0111SXA24T'
        }); //
        if(cb) cb();
      });

      socket.on('disconnect', () => {
        this.controller.dropSession(socket.id);
      });
    })
  }

  async sendChannelList (socketId: string) {
    const channels = this.controller.getChannels();
    const socket = this.io.sockets.sockets[socketId];

    if (socket) {
      socket.emit('channel_list', channels);
    }
  }

  async sendMessage ({sender, text, socketId}: SendMessageOptions) {
    const socket = this.io.sockets.sockets[socketId];

    if (socket) {
      socket.emit('message', {
        text,
        name: sender
      });
    }
  }
}

export default SocketController;