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
  io!: socketIO.Server;
  rateLimiter: RateLimiterMemory;

  constructor (controller: AppController) {
    this.controller = controller;
    this.rateLimiter = new RateLimiterMemory({
      points: 3,
      duration: 3
    });
  }

  attachToServer(server: http.Server) {
    this.io = new socketIO.Server(server, {
      allowEIO3: true,
      cors: {
        origin: true,
        credentials: true,
      },
      serveClient: false
    });
    this.initEventListeners();
  }

  initEventListeners() {

    this.io.on('connection', socket => {

      socket.on('send_message', async ({ text, image }: MessageData, cb?: (arg: Record<string, any>) => void) => {

        try {
          await this.rateLimiter.consume(socket.id);
          const response = await this.controller.handleMessageFromClient({
            text,
            socketId: socket.id,
            image
          });
          cb?.({
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

      socket.on('establish_session', ({studentName, channelId}: EstablishSessionData, cb?: () => void) => {
        this.controller.establishSession({
          name: studentName,
          socketId: socket.id,
          channelId: channelId ? channelId : 'C0111SXA24T'
        }); 
        cb?.();
      });

      socket.on('reestablish_session', async ({threadId, channelId}: ReEstablishSessionData, cb?: (arg: Record<string, any>) => void) => {
        try {
          const data = (await this.controller.reEstablisSession({
            threadId,
            channelId,
            socketId: socket.id,
          }))!;

          cb?.({
            threadId,
            channel: data.channel,
            name: data.name,
            messages: data.messages
          });
        } catch (err) {
          cb?.({ error: 'Failed re-establishing session' });
        }
      });

      socket.on('disconnect', () => {
        this.controller.dropSession(socket.id);
      });

      socket.on('get_channels', (cb?: (arg: Record<string, any>) => void) => {
        cb?.(this.controller.getChannels());
      })
    })
  }

  async sendMessage ({sender, senderAvatar, text, socketId, image}: SendMessageOptions) {
    this.io.of('/').sockets.get(socketId)?.emit('message', {
      text,
      name: sender,
      avatar: senderAvatar,
      image
    });
  }
}

export default SocketController;
