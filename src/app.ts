import _ from 'lodash';
import { Server } from 'http';

import SocketController from './socket';
import SlackController from './slack';
import channels from './channels';

interface Session {
  socketId: string;
  threadId?: string;
  studentName: string;
  channelId: string;
  receivedAnswer: boolean;
  studentThreadMessageIds: string[];
}

interface EstablishSessionOptions {
  name: string;
  socketId: string;
  channelId: string;
}

interface HandleMessageFromClientOptions {
  text: string;
  socketId: string;
  image?: Buffer;
}

interface HandleMessageFromSlackOptions {
  text: string;
  sender: string;
  threadId: string;
  senderAvatar: string;
  image?: string;
}

class AppController {

  socket: SocketController;
  slack: SlackController;
  server: Server;

  sessions: Session[] = [];

  constructor() {
    this.socket = new SocketController(this);
    this.slack = new SlackController(this);
  }

  async start () {
    const server = await this.slack.start();
    this.server = server;
    this.socket.attachToServer(server);
  }

  establishSession ({name, socketId, channelId}: EstablishSessionOptions) {
    const activeSession = this.sessions.find(session => session.socketId === socketId);
    if (activeSession) {
      this.dropSession(activeSession.socketId);
    }
    
    this.sessions.push({
      studentName: name,
      socketId,
      channelId: channelId,
      receivedAnswer: false,
      studentThreadMessageIds: []
    });
  }

  dropSession (socketId: string) {
    const droppedSessions = _.remove(this.sessions, session => session.socketId === socketId);
    if(droppedSessions.length > 0 && droppedSessions[0].threadId) {
      const droppedSession = droppedSessions[0];

      if (droppedSession.receivedAnswer) {
        this.slack.postMessage({
          channel: droppedSession.channelId,
          thread: droppedSession.threadId,
          text: `${droppedSession.studentName} has disconnected and will no longer receive your messages. Thank you for your help!`
        })
      } else {
        this.slack.deleteThread({
          channelId: droppedSession.channelId,
          threadId: droppedSession.threadId,
          threadMessageIds: droppedSession.studentThreadMessageIds
        })
      }
    } 
  }

  getChannels() {
    return channels;
  }

  /**
   * Called from SocketController
   * Send msg to slack through slackcontroller.postMessage(), to channel or thread depending on if already active session (check if threadId is set)
   */
  async handleMessageFromClient ({ text, image, socketId }: HandleMessageFromClientOptions) {
    
    const session = this.sessions.find(s => s.socketId === socketId);

    if (!session) {
      throw 'No active session';
    }

    const { studentName, threadId, channelId } = session;

    let ts;

    if (image) {
      ts = await this.slack.postImageMessage({
        text,
        channel: channelId,
        username: studentName ? studentName : 'Web Client',
        thread: threadId,
        image
      });
    } else {
      ts = await this.slack.postMessage({
        text: text,
        channel: channelId,
        username: studentName ? studentName : 'Web Client',
        thread: threadId
      });
    }

    if (!threadId) {
      session.threadId = ts;
    }

    session.studentThreadMessageIds.push(ts);

    return ts;
  }

  /**
   * Called from SlackController
   * Find session via threadId. Send message to client via socketcontroller.sendMessage()
   */
  async handleMessageFromSlack ({ text, threadId, sender, senderAvatar, image}: HandleMessageFromSlackOptions) {
    const session = this.sessions.find(s => s.threadId === threadId);

    if (session) {
      session.receivedAnswer = true;

      this.socket.sendMessage({
        socketId: session.socketId,
        text,
        sender,
        senderAvatar,
        image
      });
    }
  }
}

export default AppController;