import { withFilter } from "graphql-subscriptions";
import Redis from "ioredis";
import { RedisPubSub } from "graphql-redis-subscriptions";
import {
  ADDED_NEW_GROUP,
  REMOVE_USER_FROM_GROUP,
  redisOptions,
} from "../const.js";
import { createChannel } from "../../controller/Channel.js";
import { createError } from "../../controller/Error.js";
import { isAdmin } from "../../utils/functions.js";
import {
  createGroup,
  getGroups,
  getGroupWithMembers,
  getGroupWithMembersAdmin,
  getPrivateGroups,
  getAllGroups,
  removeUserFromGroup,
  leftGroup,
} from "../../controller/Group.js";
import { createMember } from "../../controller/Member.js";

import { throwUnauthenicated, throwBadRequest } from "../../utils/Error.js";
import { findChannelForUser } from "../../controller/User.js";

const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

export default {
  Query: {
    getGroups: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return getGroups(models, user.id);
    },
    getAllGroups: async (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      await isAdmin(user, models);

      return getAllGroups(models);
    },
    getPrivateGroups: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return getPrivateGroups(models, user.id);
    },

    getGroupWithMembers: (root, { groupId }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!groupId) {
        throwBadRequest("GroupId not passed");
        return;
      }

      return getGroupWithMembers(groupId, user.id, models);
    },
    getGroupWithMembersAdmin: async (
      root,
      { groupId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      await isAdmin(user, models);

      if (!groupId) {
        throwBadRequest("GroupId not passed");
        return;
      }

      return getGroupWithMembersAdmin(groupId, models);
    },
  },
  Mutation: {
    createGroup: async (root, { name }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!name) {
        throwBadRequest();
        return;
      }

      // name length check
      name = name.length > 24 ? name.slice(0, 24) : name;

      try {
        const [group, channel] = await models.sequelize.transaction(
          async (transaction) => {
            const channel = await createChannel(
              name,
              false,
              transaction,
              models
            );

            const group = await createGroup(
              channel.id,
              name,
              transaction,
              models
            );

            await createMember(group.id, user.id, true, transaction, models);

            return [group, channel];
          }
        );

        return {
          success: true,
          group: group,
          channel: channel,
        };
      } catch (err) {
        await createError(err, user.id, models);

        return {
          success: false,
          errors: [
            {
              path: "error creating group",
              message: "error create group",
            },
          ],
        };
      }
    },
    addGroupMember: async (
      root,
      { userId, groupId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!userId || !groupId) {
        throwBadRequest();
        return;
      }

      try {
        // Тухайн хэрэглэгч энэ группт хүн нэмж чадах эсэх
        const memberPromise = models.member.findOne(
          { where: { groupId, userId: user.id } },
          { raw: true }
        );
        // Одоогоор хэнийг ч хамаагүй группт нэмж байна, зөвхөн найзууд дундаасаа биш
        const userToAddPromise = models.user.findOne(
          { where: { id: userId } },
          { raw: true }
        );
        const [member, userToAdd] = await Promise.all([
          memberPromise,
          userToAddPromise,
        ]);
        // || !member.isAdmin
        if (!member) {
          return {
            success: false,
            errors: [
              {
                path: "Add Member",
                message: "You can't add member to this group",
              },
            ],
          };
        }
        if (!userToAdd) {
          return {
            success: false,
            errors: [{ path: "id not found", message: "User not found" }],
          };
        }
        await models.member.create({ userId: userToAdd.id, groupId });

        const group = await models.group.findOne({
          where: {
            id: groupId,
          },
        });

        await models.notification.create({
          type: "addedGroup",
          myId: user.id,
          userId: userId,
          info: group.name,
        });

        pubsub.publish(ADDED_NEW_GROUP, {
          channelId: group.channelId,
          // addedNewGroup: group,
          addedNewGroup: {
            group: group,
            host: user,
            addedUser: userToAdd,
          },
        });

        return {
          success: true,
        };
      } catch (err) {
        await models.error.create({
          name: err.message,
          file: err.fileName || "resolvers/group.js",
          user_id: user.id,
        });

        return {
          success: false,
          errors: [{ path: "error addGroupMember", message: err.message }],
        };
      }
    },

    removeUserFromGroup: async (
      root,
      { userId, groupId, groupName, channelId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!userId || !groupId || !groupName || !channelId) {
        throwBadRequest();
        return;
      }

      try {
        pubsub.publish(REMOVE_USER_FROM_GROUP, {
          channelId: channelId,
          removeUserFromGroup: {
            group: {
              id: groupId,
              name: groupName,
              channelId,
              createdAt: "",
            },
            removedUserId: userId,
          },
        });

        await removeUserFromGroup(groupId, userId, groupName, models, user);

        return true;
      } catch (err) {
        console.log("error removeUserFromGroup: ", err);
        return false;
      }
    },

    leftGroup: async (
      root,
      { groupId, groupName, channelId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!groupId || !groupName || !channelId) {
        throwBadRequest();
        return;
      }

      try {
        return await leftGroup(groupId, groupName, models, user);
      } catch (err) {
        console.log("error leftGroup: ", err);
        return false;
      }
    },
  },
  Subscription: {
    addedNewGroup: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(ADDED_NEW_GROUP);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },
    removeUserFromGroup: {
      subscribe: withFilter(
        (root, args, { user }) => {
          if (!user) {
            throwUnauthenicated();
          }

          return pubsub.asyncIterator(REMOVE_USER_FROM_GROUP);
        },
        (root, args, { user }) => findChannelForUser(root.channelId, user.id)
      ),
    },
  },
};
