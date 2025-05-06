import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { withFilter } from "graphql-subscriptions";
import {
  NEW_CHANNEL_MESSAGE,
  REACTION_MESSAGE,
  SEEN_MESSAGE,
  UNSEND_MESSAGE,
  redisOptions,
} from "../const.js";
import { throwUnauthenicated, throwBadRequest } from "../../utils/Error.js";
import {
  getMessages,
  createMessage,
  getLastMessage,
  createFileMessage,
  seenMessage,
  reactionMessage,
  unsendMessage,
  seenChannelMessages,
  getMediaFiles,
} from "../../controller/Message.js";
import { findChannelForUser } from "../../controller/User.js";
import {
  sendMultiPushNotification,
  sendPushNotification,
} from "../../controller/Notification.js";

const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

export default {
  Query: {
    getMessages: async (
      root,
      { channelId, offset, limit },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!channelId || !limit) {
        throwBadRequest("Variables not received");
        return;
      }

      return getMessages(channelId, offset, limit, models, user);
    },
    getMediaFiles: (
      root,
      { channelId, offset, limit },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!channelId || !limit) {
        throwBadRequest("Variables not received");
        return;
      }

      return getMediaFiles(channelId, offset, limit, models, user);
    },
    getLastMessage: async (root, { channelId }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }
      if (!channelId) {
        throwBadRequest("channelId not received.");
        return;
      }

      return getLastMessage(channelId, models, user);
    },
  },
  Mutation: {
    createMessage: async (
      root,
      { channelId, msgKey, text, isInfo },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!channelId || !text) {
        throwBadRequest();
        return;
      }

      const msg = await createMessage(
        channelId,
        msgKey,
        text,
        isInfo,
        models,
        user
      );

      pubsub.publish(NEW_CHANNEL_MESSAGE, {
        channelId: channelId,
        newChannelMessage: {
          ...msg.dataValues,
          avatar: user.avatar,
          name: user.name,
        },
      });

      if (msg.dm) {
        // sending push notification
        await sendPushNotification(msg.userId, msg.channelId, models, user);
      } else {
        // send multiple push notification
        await sendMultiPushNotification(
          msg.userId,
          msg.channelId,
          models,
          user
        );
      }

      return true;
    },

    createFileMessage: async (
      root,
      { channelId, text },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!channelId || !text) {
        throwBadRequest();
        return;
      }

      const msg = await createFileMessage(channelId, text, models, user);

      pubsub.publish(NEW_CHANNEL_MESSAGE, {
        channelId: channelId,
        newChannelMessage: {
          ...msg.dataValues,
          isFile: true,
          avatar: user.avatar,
          name: user.name,
        },
      });

      if (msg.dm) {
        // sending push notification
        await sendPushNotification(
          msg.userId,
          msg.channelId,
          models,
          user,
          true
        );
      } else {
        // send multiple push notification
        await sendMultiPushNotification(
          msg.userId,
          msg.channelId,
          models,
          user,
          true
        );
      }

      return true;
    },

    seenMessage: async (
      root,
      { channelId, messageId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!messageId || !channelId) {
        throwBadRequest();
        return;
      }

      try {
        const seen = await seenMessage(channelId, messageId, models, user);

        pubsub.publish(SEEN_MESSAGE, {
          channelId: channelId,
          seenMessage: {
            id: seen.id,
            msgId: seen.messageId,
            // userId: seen.userId,
            user: user,
            channelId: channelId,
            seen: seen.seen,
          },
        });

        return true;
      } catch (error) {
        console.log("Error in mutation `seenMessage`: ", error);
      }

      return false;
    },

    seenChannelMessages: async (
      root,
      { channelId, limit },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if ((!channelId, !limit)) {
        throwBadRequest();
        return;
      }

      await seenChannelMessages(channelId, limit, models, user);

      return true;
    },
    unsendMessage: async (
      root,
      { channelId, messageId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!messageId || !channelId) {
        throwBadRequest();
        return;
      }

      const unsend = await unsendMessage(channelId, messageId, models, user);

      if (unsend[0] === 0) {
        return false;
      }

      pubsub.publish(UNSEND_MESSAGE, {
        channelId: channelId,
        unsendMessage: {
          msgId: messageId,
          user: user,
          channelId: channelId,
        },
      });

      return true;
    },
    reactionMessage: async (
      root,
      { channelId, messageId, reaction },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!messageId || !channelId || !reaction) {
        throwBadRequest();
        return;
      }

      const react = await reactionMessage(
        channelId,
        messageId,
        reaction,
        models,
        user
      );

      if (react === null) {
        return true;
      }

      pubsub.publish(REACTION_MESSAGE, {
        channelId: channelId,
        reactionMessage: {
          id: react.id,
          msgId: react.messageId,
          user: user,
          channelId: channelId,
          reaction: react.reaction,
        },
      });

      return true;
    },
  },

  Subscription: {
    newChannelMessage: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(NEW_CHANNEL_MESSAGE);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },
    seenMessage: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(SEEN_MESSAGE);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },

    unsendMessage: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(UNSEND_MESSAGE);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },
    reactionMessage: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(REACTION_MESSAGE);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },
  },
};
