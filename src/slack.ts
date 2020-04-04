import { App } from '@slack/bolt';
import { WebAPICallResult } from '@slack/web-api';
import AppController from './app';
import { Server } from 'http';
import _ from 'lodash';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_USER_TOKEN = '';

class SlackController {
  
  app: App;
  controller: AppController;
  
  constructor (controller: AppController) {
    this.controller = controller;

    this.app = new App({
      token: SLACK_BOT_TOKEN,
      signingSecret: SLACK_SIGNING_SECRET
    });

    this.initEventListeners();
  }

  async start (): Promise<Server> {
    const port = process.env.PORT || 3000;
    const server = await this.app.start(port) as Server;
    console.log(`⚡️ Bolt app is running on :${port}`);
    return server;
  }

  initEventListeners () {

    this.app.message(async ({message, context}) => {
      
      if (message.thread_ts) {
        const userInfo = await this.app.client.users.info({
          user: message.user,
          token: context.botToken
        }) as UserInfoResult;
  
        console.log(userInfo);

        
        this.controller.handleMessageFromSlack({
          sender: userInfo.user.profile.display_name,
          text: message.text,
          threadId: message.thread_ts
        });
      }
    });
  }

  async postMessage ({text, channel, username, thread}: PostMessageOptions) {
    const response = await this.app.client.chat.postMessage({
      token: SLACK_BOT_TOKEN,
      text,
      channel,
      username: username ? username : 'DoTheMathBot',
      thread_ts: thread
    }) as ChatPostMessageResult;

    return response;
  }
  
}

interface PostMessageOptions {
  text: string;
  channel: string;
  username?: string;
  thread?: string;
}

interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  }
}

interface UserInfoResult extends WebAPICallResult {
  user: {
    profile: {
      display_name: string
    }
  }
}

export default SlackController;