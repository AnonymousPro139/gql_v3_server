import { Op } from "sequelize";
import { Expo } from "expo-server-sdk";
import { DEBOUNCE_PUSH_NOTIFICATION_TIME } from "../graphql/const.js";
// const { Expo } = require('expo-server-sdk');

export const myNotifications = async (models, user) => {
  const tmp = await models.notification.findAll({
    where: {
      [Op.or]: [
        {
          myId: user.id,
        },
        {
          userId: user.id,
        },
        { type: "system" },
      ],
    },
    order: [["createdAt", "DESC"]],
    limit: 15,
    offset: 0,
    include: [
      {
        model: models.user,
        as: "my",
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
      {
        model: models.user,
        as: "target",
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
    ],
  });

  return (
    tmp?.map((el) => {
      var my = el.my;
      my.avatar = el.my?.avatar?.avatar_link ?? "no-link";

      var target = el.target;
      target.avatar = el.target?.avatar?.avatar_link ?? "no-link";

      return {
        ...el.dataValues,
        my: my,
        target: target,
      };
    }) ?? []
  );
};

// multiple push notification
export const sendMultiPushNotification = async (
  senderId,
  channelId,
  models,
  user,
  isFile = false
) => {
  const expo = new Expo();

  // тухайн channel-д байгаа users-g pushtoken той нь авах
  const group = await models.group.findOne({
    where: {
      channelId: channelId,
    },
    attributes: ["name"],
    include: [
      {
        model: models.user,

        attributes: ["id", "name"],
        include: {
          model: models.push_notification,
          attributes: ["status", "pushtoken", "lastNotificationTime"],
        },
      },
    ],
  });

  const sender = group?.users.filter((e) => e.id === senderId);

  const pushtokens =
    group?.users.map((usr) => {
      var tmp = usr.push_notification;

      if (tmp?.lastNotificationTime !== undefined) {
        const now = Date.now();

        if (now - tmp.lastNotificationTime < DEBOUNCE_PUSH_NOTIFICATION_TIME) {
          return;
        }
      }

      if (
        usr.id !== user.id &&
        tmp?.status === "active" &&
        tmp?.pushtoken !== undefined &&
        tmp?.pushtoken !== ""
      ) {
        // update and set lastNotification time to Date.now
        models.push_notification
          .findOne({
            where: {
              userId: usr.id,
            },
          })
          .then((res) => {
            res.update({ lastNotificationTime: Date.now() }).then((res) =>
              res.save().then(() => {
                console.log("The lastNotificationTime successfully changed...");
              })
            );
          })
          .catch((err) => console.log("error:", err));

        return {
          to: tmp.pushtoken,
          title: group.name,
          body: isFile
            ? `${sender[0].name}: New file`
            : `${sender[0].name}: New message`,
          data: {
            navigate: "Groups",
          },
        };
      }
    }) ?? null;

  // remove undefined
  const result = pushtokens?.filter((e) => e !== undefined);

  if (result?.length > 0) {
    let chunks = expo.chunkPushNotifications(result);
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log("Multi push notification receipts:", receipts);
      } catch (error) {
        console.error("Multi push notification error:", error);
      }
    }
  }
};

export const sendPushNotification = async (
  senderId,
  channelId,
  models,
  user,
  isFile = false
) => {
  const expo = new Expo();

  // тухайн channel-д байгаа users-g pushtoken той нь авах
  const group = await models.group.findOne({
    where: {
      channelId: channelId,
    },
    attributes: ["id"],
    include: [
      {
        model: models.user,
        attributes: ["id", "name"],
        include: {
          model: models.push_notification,
          attributes: ["status", "pushtoken", "lastNotificationTime"],
        },
      },
    ],
  });

  const sender = group?.users.filter((e) => e.id === senderId);

  const pushtoken =
    group?.users.map((usr) => {
      var tmp = usr.push_notification;

      if (tmp?.lastNotificationTime !== undefined) {
        const now = Date.now();

        if (now - tmp.lastNotificationTime < DEBOUNCE_PUSH_NOTIFICATION_TIME) {
          return;
        }
      }

      if (
        usr.id !== user.id &&
        tmp?.status === "active" &&
        tmp?.pushtoken !== undefined &&
        tmp?.pushtoken !== ""
      ) {
        // update and set lastNotification time to Date.now
        models.push_notification
          .findOne({
            where: {
              userId: usr.id,
            },
          })
          .then((res) => {
            res.update({ lastNotificationTime: Date.now() }).then((res) =>
              res.save().then(() => {
                console.log("The lastNotificationTime successfully changed");
              })
            );
          })
          .catch((err) => console.log("error:", err));

        return {
          to: tmp.pushtoken,
          title: sender[0].name,
          body: isFile ? "New file" : "New message",
          data: {
            navigate: "Chats",
          },
        };
      }
    }) ?? null;

  // remove undefined
  const result = pushtoken?.filter((e) => e !== undefined);

  if (result?.length > 0) {
    let chunks = expo.chunkPushNotifications(result);
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push notification receipts:", receipts);
      } catch (error) {
        console.error("Push notification error:", error);
      }
    }
  }
};
