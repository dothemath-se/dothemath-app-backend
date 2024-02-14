import { App, GenericMessageEvent } from "@slack/bolt";
import { WebAPICallResult } from "@slack/web-api";
import AppController from "./app";
import { Server } from "http";
import _ from "lodash";
import { getImageURLFromSlackPage, parseEmojis } from "./utils";
import { log } from "console";

const PORT = process.env.PORT;
const SLACK_BOT_TOKEN =
  // "xoxb-1002182647141-1124795116725-hXGGsVfawJU4eJP035Cp70Hc";
  "xoxb-1002182647141-1124795116725-L2IsMthYhY09KOR2Zw25SN4P";
const SLACK_SIGNING_SECRET = "e536289c0764fb04e58380d194ff0cf8";
const SLACK_USER_TOKEN =
  // "xoxp-1002182647141-990841773091-1119441891030-3cf8bb777c69b47d83d9cd1f529b135c";
  "xoxp-1002182647141-1048780075568-5216856996080-af03e75e6c3a7e1f1addae46671fa5ea";
export default class SlackController {
  private app: App;
  controller: AppController;

  private botId!: string;
  private botUserId!: string;

  constructor(controller: AppController) {
    this.controller = controller;

    this.app = new App({
      token: SLACK_BOT_TOKEN,
      signingSecret: SLACK_SIGNING_SECRET,
    });

    this.initEventListeners();
  }

  async start(): Promise<Server> {
    // Parsing PORT into a Number does not seem to work on Azure.
    const server = await this.app.start(PORT as any);
    const { bot_id, user_id } = await this.app.client.auth.test({
      token: SLACK_BOT_TOKEN,
    }) as AuthTestResult;
    this.botId = bot_id;
    this.botUserId = user_id;

    console.log(`⚡️ Bolt app is running on http://localhost:${PORT}`);
    return server;
  }

  initEventListeners() {
    this.app.message(async ({ message, context }) => {
      // Current typings are (as of v3.3.0) incomplete and confusing. This is a fairly safe way around it.
      const messageEvent = message as GenericMessageEvent;

      if (messageEvent.thread_ts) {
        const userInfo = await this.app.client.users.info({
          user: messageEvent.user,
          token: context.botToken,
        }) as UserInfoResult;

        let imageURL!: string;

        if (messageEvent.files) {
          const imageResponse = await this.app.client.files.sharedPublicURL({
            file: messageEvent.files[0].id,
            token: SLACK_USER_TOKEN,
          }) as FilesSharedPublicURLResult;
          imageURL = await getImageURLFromSlackPage(
            imageResponse.file.permalink_public,
          );
        }

        this.controller.handleMessageFromSlack({
          sender: userInfo.user.real_name,
          text: parseEmojis(messageEvent.text!),
          threadId: messageEvent.thread_ts,
          senderAvatar: userInfo.user.profile.image_48,
          image: imageURL,
        });
      }
    });
  }

  async postMessage(
    { text, channel, username, thread }: PostMessageOptions,
  ): Promise<string> {
    console.log("postMessage");

    const response = await this.app.client.chat.postMessage({
      token: SLACK_BOT_TOKEN,
      text,
      channel,
      username: username ? username : "DoTheMathBot",
      thread_ts: thread,
    }) as ChatPostMessageResult;

    console.log(response);

    return response.ts;
  }

  async postImageMessage(
    { text, image, channel, username, thread }: PostImageMessageOptions,
  ): Promise<string> {
    const response = await this.app.client.files.upload({
      token: SLACK_BOT_TOKEN,
      channels: channel,
      thread_ts: thread,
      initial_comment: `*${username}*: ${text}`,
      file: image,
    }) as FilesUploadResult;

    await this.app.client.files.sharedPublicURL({
      file: response.file.id,
      token: SLACK_USER_TOKEN,
    });

    response.ts = response.file.shares.public[channel][0].ts;

    return response.file.shares.public[channel][0].ts;
  }

  async deleteThread(
    { threadId, channelId, threadMessageIds }: DeleteThreadOptions,
  ) {
    const responses = await Promise
      .all(
        _.uniq([...threadMessageIds, threadId])
          .map((id) =>
            this.app.client.chat
              .delete({
                token: SLACK_BOT_TOKEN,
                channel: channelId,
                ts: id,
              })
          ),
      );

    return responses;
  }

  async getThread(
    { threadId, channelId }: GetThreadOptions,
  ): Promise<GetThreadResult> {
    console.log("getThread");

    const response = await this.app.client.conversations.replies({
      token: SLACK_BOT_TOKEN,
      channel: channelId,
      ts: threadId,
    }) as ConversationsRepliesResult;

    const { messages } = response;

    let studentUsername!: string;

    const studentTextMessages = messages.filter((m) =>
      m.subtype && m.subtype === "bot_message" && m.bot_id === this.botId
    );
    const studentImageMessages = messages.filter((m) =>
      m.upload && m.user === this.botUserId
    );

    if (studentTextMessages.length > 0) {
      studentUsername = studentTextMessages[0].username!;
    } else if (studentImageMessages.length > 0) {
      const messageSplit = studentImageMessages[0].text!.split("*");
      studentUsername = messageSplit[1];
    }

    const users = await Promise.all(
      _.uniq(
        messages
          .filter((m) => m.user && m.user !== this.botUserId)
          .map((m) => m.user),
      ).map((userId) => {
        return this.app.client.users.info({
          token: SLACK_BOT_TOKEN,
          user: userId!,
        }) as Promise<UserInfoResult>;
      }),
    );

    const usernames = users.reduce((acc, cur) => {
      acc[cur.user.id] = cur.user.real_name;
      return acc;
    }, {} as { [key: string]: string });

    const returnMessages = await Promise.all(messages.map(async (message) => {
      const isUser = (!!message.subtype && message.subtype === "bot_message" &&
        message.bot_id === this.botId) ||
        (!!message.upload && message.user === this.botUserId);
      const name = isUser ? studentUsername : usernames[message.user!];
      let text = "";
      let image = "";

      if (isUser && message.upload && message.text) {
        const messageSplit = message.text.split(`${studentUsername}*: `);
        if (messageSplit.length > 1) {
          text = messageSplit[1];
        }
      } else if (message.text) {
        text = message.text;
      }

      if (message.upload && message.files && message.files[0]) {
        image = await getImageURLFromSlackPage(
          message.files[0].permalink_public,
        );
      }

      return {
        isUser,
        text: parseEmojis(text),
        name,
        image,
      };
    }));

    return {
      threadId,
      channelId,
      username: studentUsername,
      messages: returnMessages,
    };
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

interface GetThreadOptions {
  threadId: string;
  channelId: string;
}

interface GetThreadResult {
  threadId: string;
  channelId: string;
  username: string;
  messages: {
    name: string;
    text?: string;
    image?: string;
    isUser: boolean;
  }[];
}

interface PostImageMessageOptions extends PostMessageOptions {
  image: Buffer;
}

interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

interface FilesUploadResult extends WebAPICallResult {
  file: {
    id: string;
    shares: {
      public: {
        [key: string]: {
          ts: string;
        }[];
      };
    };
  };
}

interface UserInfoResult extends WebAPICallResult {
  user: {
    id: string;
    real_name: string;
    profile: {
      display_name: string;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
    };
  };
}

interface SlackFile {
  name: string;
  user: string;
  is_public: boolean;
  permalink_public: string;
}

interface FilesSharedPublicURLResult extends WebAPICallResult {
  file: SlackFile;
}

interface AuthTestResult extends WebAPICallResult {
  user_id: string;
  bot_id: string;
}

interface Message {
  subtype?: string;
  ts: string;
  thread_ts: string;
  type: string;
  text?: string;
  user?: string;
  username?: string;
  bot_id?: string;
  upload?: boolean;
  files?: SlackFile[];
}

interface ConversationsRepliesResult extends WebAPICallResult {
  messages: Message[];
}
