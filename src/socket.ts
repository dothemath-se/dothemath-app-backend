import http from 'http';
import socketIO from 'socket.io';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import AppController from './app';

interface EstablishSessionData {
  studentName: string;
  channelId: string;
}

interface ReEstablishSessionData {
  threadId: string;
  channelId: string;
}

interface MessageData {
  text: string;
  image?: Buffer;
}

interface SendMessageOptions {
  socketId: string;
  text: string;
  sender: string;
  senderAvatar: string;
  image?: string;
}

// Handles communication to/from frontend via websockets
class SocketController {

  controller: AppController;
  io!: SocketIO.Server;
  rateLimiter: RateLimiterMemory;

  constructor (controller: AppController) {
    this.controller = controller;
    this.rateLimiter = new RateLimiterMemory({
      points: 3,
      duration: 3
    });
  }

  attachToServer(server: http.Server) {
    this.io = socketIO(server);
    this.initEventListeners();
  }

  initEventListeners() {

    this.io.on('connection', socket => {

      this.sendChannelList(socket.id);

      socket.on('send_message', async ({ text, image }: MessageData, cb: any) => {

        try {
          await this.rateLimiter.consume(socket.id);
          const response = await this.controller.handleMessageFromClient({
            text,
            socketId: socket.id,
            image
          });
          if (cb) cb({
            ts: response.ts,
            threadId: response.threadId
          });
        } catch (err) {
          if (err.msBeforeNext) {
            const secondsBeforeNext = Math.ceil(err.msBeforeNext / 1000);
            socket.emit('message', {
              text: `Ditt meddelande blev blockerat då du skickar för många i snabb följd. Skriv hellre längre meddelanden än att skicka många korta. Försök igen om ${secondsBeforeNext} sekund${secondsBeforeNext > 1 ? 'er' : ''}.`,
              name: "DoTheMath"
            });
          }
        }
      });

      socket.on('establish_session', ({studentName, channelId}: EstablishSessionData, cb: any) => {
        this.controller.establishSession({
          name: studentName,
          socketId: socket.id,
          channelId: channelId ? channelId : 'C0111SXA24T'
        }); 
        if(cb) cb();
      });

      socket.on('reestablish_session', async ({threadId, channelId}: ReEstablishSessionData, cb: any) => {
        try {
          const data = (await this.controller.reEstablisSession({
            threadId,
            channelId,
            socketId: socket.id,
          }))!;

          if(cb) cb({
            threadId,
            channel: data.channel,
            name: data.name,
            messages: data.messages
          });
        } catch (err) {
          if (cb) cb({ error: 'Failed re-establishing session' });
        }
      });

      socket.on('disconnect', () => {
        this.controller.dropSession(socket.id);
      });

      socket.on('get_channels', (cb: any) => {
        if (cb && typeof cb === 'function') {
          const channels = this.controller.getChannels();
          cb(channels);
        }
      })
    })
  }

  async sendChannelList (socketId: string) {
    const channels = this.controller.getChannels();
    const socket = this.io.sockets.sockets[socketId];

    if (socket) {
      socket.emit('channel_list', channels);
    }
  }

  async sendMessage ({sender, senderAvatar, text, socketId, image}: SendMessageOptions) {
    const socket = this.io.sockets.sockets[socketId];

    if (socket) {
      socket.emit('message', {
        text,
        name: sender,
        avatar: senderAvatar,
        image
      });
    }
  }
}

export default SocketController;