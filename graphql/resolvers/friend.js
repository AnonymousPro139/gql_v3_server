import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { withFilter } from "graphql-subscriptions";
import { createError } from "../../controller/Error.js";
import { throwUnauthenicated, throwBadRequest } from "../../utils/Error.js";
import {
  NEW_FRIEND_REQUEST,
  FRIEND_REQUEST_RESPONSE,
  redisOptions,
  UNFRIEND,
} from "../const.js";
import { getPublicKeys, getUserGQL } from "../../controller/User.js";
import { createMember } from "../../controller/Member.js";
import {
  createFriend,
  getFriend,
  updateFriend,
  myFriends,
  deleteFriend,
  checkFriends,
  unFriend,
} from "../../controller/Friend.js";
import { createChannel } from "../../controller/Channel.js";
import { createPrivateGroup } from "../../controller/Group.js";

const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

export default {
  Query: {
    myFriends: async (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return await myFriends(user.id, models);
    },
  },
  Mutation: {
    createFriendRequest: async (
      root,
      { target_userId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!target_userId) {
        throwBadRequest();
        return;
      }

      const sender = await getUserGQL(user.id, models);

      if (!sender) {
        throwBadRequest("Sender User not found!");
      }

      const target = await getUserGQL(target_userId, models);

      if (!target) {
        throwBadRequest("Target user not found!");
      }

      // Хэрвээ хүсэлт илгээсэн бол дахиж илгээхгүй
      const friends = await checkFriends(target_userId, user.id, models);

      if (friends === true) {
        throwBadRequest("Already written request!");
        return;
      }

      try {
        await createFriend(user.id, target_userId, models);

        await models.notification.create({
          type: "friendRequest",
          myId: user.id,
          userId: target_userId,
        });

        pubsub.publish(NEW_FRIEND_REQUEST, {
          target_userId,
          newFriendRequest: sender,
        });

        return true;
      } catch (err) {
        await createError(err, user.id, models);
      }

      return false;
    },
    friendRequestResponse: async (
      root,
      { candidate_userId, isAllow },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!candidate_userId || isAllow === undefined) {
        throwBadRequest();
        return;
      }

      const friends = await getFriend(candidate_userId, user.id, models);

      if (!friends) {
        throwBadRequest("Friends not found!");
        return;
      }

      if (isAllow == true) {
        await models.notification.create({
          type: "friend",
          myId: candidate_userId,
          userId: user.id,
        });

        await updateFriend(friends, isAllow);
      } else {
        await models.notification.create({
          type: "cancelRequest",
          myId: user.id,
          userId: candidate_userId,
        });

        // Хүсэлтэнд зөвшөөрөөгүй бол устгах
        await deleteFriend(friends);
      }

      if (isAllow == true) {
        // Хэрэв 2 хүн найз болсон үед групп үүсгэж өгөх
        try {
          const group = await models.sequelize.transaction(
            async (transaction) => {
              // 2 хүний private channel
              const channel = await createChannel(
                "private",
                true,
                transaction,
                models
              );

              const group = await createPrivateGroup(
                channel.id,
                transaction,
                models
              );
              // 2 найзыг member-т бичих
              await createMember(group.id, user.id, true, transaction, models);
              await createMember(
                group.id,
                candidate_userId,
                true,
                transaction,
                models
              );

              return group;
            }
          );

          // public keys-g awah
          var pubkeys = await getPublicKeys(user.id, models);

          pubsub.publish(FRIEND_REQUEST_RESPONSE, {
            candidate_userId,
            friendRequestResponse: {
              from: {
                id: user.id,
                lid: user.lid,
                name: user.name,
                avatar: user.avatar,
                email: "email-not-shown",
                phone: user.phone,
              },
              group: group,
              keys: {
                id: pubkeys?.keys?.id ?? 0,
                IdPubKey: pubkeys?.keys?.IdPubKey ?? "",
                Signature: pubkeys?.keys?.Signature ?? "",
                SpPubKey: pubkeys?.keys?.SpPubKey ?? "",
                SignaturePubKey: pubkeys?.keys?.SignaturePubKey ?? "",
              },
              ephkey: {
                id: pubkeys?.ephkey?.id ?? 0,
                userId: user.id,
                ephkey: pubkeys?.ephkey?.ephkey ?? "",
              },
              isAllow,
            },
          });

          return {
            success: true,
            group: group,
          };
        } catch (err) {
          console.log("err", err);
          await createError(err, user.id, models);

          // isFriend true bolson c gsn channel, group uusej chadaaagui uchir false bolgoh
          await updateFriend(friends, false);

          return {
            success: false,
            errors: [
              {
                path: "resolvers/friend.js",
                message: "Error while creating group for friends",
              },
            ],
          };
        }
      } else {
        pubsub.publish(FRIEND_REQUEST_RESPONSE, {
          candidate_userId,
          friendRequestResponse: {
            from: {
              id: user.id,
              lid: user.lid,
              name: user.name,
              email: "email-not-shown",
              avatar: user.avatar,
              phone: user.phone,
            },
            group: null,
            isAllow,
          },
        });
      }

      return {
        success: true,
      };
    },

    unFriend: async (
      root,
      { friendId, groupId, channelId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!friendId || !groupId || !channelId) {
        throwBadRequest();
        return;
      }

      try {
        await unFriend(friendId, groupId, channelId, user, models);
        pubsub.publish(UNFRIEND, {
          target_userId: friendId,
          Unfriend: user,
        });

        return true;
      } catch (err) {
        await createError(err, user.id, models);
      }

      return false;
    },
  },

  Subscription: {
    newFriendRequest: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(NEW_FRIEND_REQUEST);
        },
        (payload, args, { user }) => payload.target_userId === user.id
      ),
    },

    friendRequestResponse: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(FRIEND_REQUEST_RESPONSE);
        },
        (payload, args, { user }) => payload.candidate_userId === user.id
      ),
    },
    Unfriend: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(UNFRIEND);
        },
        (payload, args, { user }) => payload.target_userId === user.id
      ),
    },
  },
};
