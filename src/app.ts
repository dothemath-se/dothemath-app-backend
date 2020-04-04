import prompts = require('prompts');
import _ from 'lodash';
import { Server } from 'http';

import SocketController from './socket';
import SlackController from './slack';

interface Session {
  socketId: string;
  threadId?: string;
  studentName: string;
}

interface EstablishSessionOptions {
  name: string;
  socketId: string;
}

interface HandleMessageFromClientOptions {
  message: string;
  socketId: string;
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

  establishSession ({name, socketId}: EstablishSessionOptions) {
    const activeSession = this.sessions.find(session => session.socketId === socketId);
    if (activeSession) {
      this.dropSession(activeSession.socketId);
    }
    
    this.sessions.push({
      studentName: name,
      socketId
    });

    console.log(this.sessions);
  }

  dropSession (socketId: string) {
    _.remove(this.sessions, session => session.socketId === socketId);
  }

  getChannels() {
    return [
      { name: 'bot-test', id: 'C0111SXA24T'},
      { name: 'bot-test-2', id: 'C011ENW7TJQ'}
    ]
  }

  async handleMessageFromClient ({ message, socketId }: HandleMessageFromClientOptions) {
    
    const session = this.sessions.find(s => s.socketId === socketId);

    if (!session) {
      throw 'No active session';
    }

    const { studentName, threadId } = session;

    const response = await this.slack.postMessage({
      text: message,
      channel: 'C0111SXA24T',
      username: studentName ? studentName : 'Web Client',
      thread: threadId
    });

    if (!threadId) {
      session.threadId = response.ts;
    }

    return response;
    /**
     * Called from SocketController
     * Send msg to slack through slackcontroller.postMessage(), to channel or thread depending on if already active session (check if threadId is set)
     * Send msg to client through socketcontroller confirming question's been posted
     */
  }

  async handleMessageFromSlack (data: any) {
    /**
     * Called from SlackController
     * Find session via threadId. Send message to client via socketcontroller.sendMessage()
     */
  }

  // development method to send questions through commandline 
  async prompt () {
    const { question, threadMessage } = await prompts([{
      type: 'text',
      name: 'question',
      message: 'Ask question on Slack:'
    }, {
      type: 'text',
      name: 'threadMessage',
      message: 'Add additional info in thread:'
    }]);

    const response = await this.slack.postMessage({
      channel: 'C0111SXA24T',
      text: question,
      username: 'Student'
    });

    await this.slack.postMessage({
      channel: 'C0111SXA24T',
      text: threadMessage,
      thread: response.ts,
      username: 'Student'
    });
  }
}

export default AppController;