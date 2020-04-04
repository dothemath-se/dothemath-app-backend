import { App } from '@slack/bolt';
import { WebAPICallResult } from '@slack/web-api';
import AppController from './app';
import { Server } from 'http';
import _ from 'lodash';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_USER_TOKEN = process.env.SLACK_USER_TOKEN;

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

        let imageURL: string;

        if (message.files) {
          const imageResponse = await this.app.client.files.sharedPublicURL({
            file: message.files[0].id,
            token: SLACK_USER_TOKEN
          }) as FilesSharedPublicURLResult;
          imageURL = imageResponse.file.permalink_public
        }

        
        this.controller.handleMessageFromSlack({
          sender: userInfo.user.profile.display_name,
          text: message.text,
          threadId: message.thread_ts,
          senderAvatar: userInfo.user.profile.image_48,
          image: imageURL
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

  async deleteThread({threadId, channelId, threadMessageIds}: DeleteThreadOptions) {
    const responses = await Promise
    .all(threadMessageIds
      .map(id => this.app.client.chat
        .delete({
          token: SLACK_BOT_TOKEN,
          channel: channelId,
          ts: id
        })));
    
    return responses;
  }
  
}

interface DeleteThreadOptions {
  threadId: string;
  channelId: string;
  threadMessageIds: string[];
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
      display_name: string,
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
    }
  }
}

interface FilesSharedPublicURLResult extends WebAPICallResult {
  file: {
    permalink_public: string;
  }
}

export default SlackController;