import _ from 'lodash';
import { Server } from 'http';

import SocketController from './socket';
import SlackController from './slack';
import attachRootListener from './attachRootListener';

import { fixAzureAppSettingsEncoding } from './fixAzureAppSettingsEncoding';

const SLACK_CHANNELS_RAW = process.env.SLACK_CHANNELS!;
const SLACK_CHANNELS_FIX_AZURE_ENCODING = process.env.SLACK_CHANNELS_FIX_AZURE_ENCODING === 'true';
const SLACK_CHANNELS_FIXED = SLACK_CHANNELS_FIX_AZURE_ENCODING ? fixAzureAppSettingsEncoding(SLACK_CHANNELS_RAW) : SLACK_CHANNELS_RAW;
const SLACK_CHANNELS = JSON.parse(SLACK_CHANNELS_FIXED!) as [{ id: string; }];

interface Session {
  socketId?: string;
  threadId?: string;
  studentName: string;
  channelId: string;
}

interface EstablishSessionOptions {
  name: string;
  socketId: string;
  channelId: string;
}

interface ReEstablishSessionOptions {
  threadId: string;
  channelId: string;
  socketId: string;
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
  server!: Server;

  sessions: Session[] = [];

  constructor() {
    this.socket = new SocketController(this);
    this.slack = new SlackController(this);
  }

  async start () {
    const server = await this.slack.start();
    this.server = server;
    this.socket.attachToServer(server);
    attachRootListener(server);
  }

  establishSession ({name, socketId, channelId}: EstablishSessionOptions) {
    const activeSession = this.sessions.find(session => session.socketId === socketId);
    if (activeSession) {
      this.dropSession(activeSession.socketId!);
    }
    
    this.sessions.push({
      studentName: name,
      socketId,
      channelId: channelId,
    });
  }

  async reEstablisSession ({socketId, channelId, threadId}: ReEstablishSessionOptions) {
    _.remove(this.sessions, session => session.socketId === socketId || (session.channelId === channelId && session.threadId === threadId));
    const threadData = await this.slack.getThread({ channelId, threadId });
    if (threadData) {
      this.sessions.push({
        studentName: threadData.username,
        channelId,
        threadId,
        socketId
      });

      return {
        channel: SLACK_CHANNELS.find((c) => c.id === channelId),
        threadId,
        name: threadData.username,
        messages: threadData.messages
      };
    }
  }

  dropSession (socketId: string) {
    const droppedSessions = _.remove(this.sessions, session => session.socketId === socketId);
    
    /*
    if(droppedSessions.length > 0 && droppedSessions[0].threadId) {
      const droppedSession = droppedSessions[0];

      this.slack.postMessage({
        channel: droppedSession.channelId,
        thread: droppedSession.threadId,
        text: `${droppedSession.studentName} has gone offline.`
      })
  
    }
    */
  }

  getChannels() {
    return SLACK_CHANNELS;
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

    return {
      ts,
      threadId: session.threadId
    };
  }

  /**
   * Called from SlackController
   * Find session via threadId. Send message to client via socketcontroller.sendMessage()
   */
  async handleMessageFromSlack ({ text, threadId, sender, senderAvatar, image}: HandleMessageFromSlackOptions) {

    const session = this.sessions.find(s => s.threadId === threadId);

    if (session) {
      this.socket.sendMessage({
        socketId: session.socketId!,
        text,
        sender,
        senderAvatar,
        image
      });
    }
  }
}

export default AppController;