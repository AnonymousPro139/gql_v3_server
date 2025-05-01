import { Op, where } from "sequelize";
import { Expo } from "expo-server-sdk";
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
  user
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
          attributes: ["status", "pushtoken"],
        },
      },
    ],
  });

  const sender = group?.users.filter((e) => e.id === senderId);

  const pushtokens =
    group?.users.map((usr) => {
      var tmp = usr.push_notification;
      if (
        usr.id !== user.id &&
        tmp?.status === "active" &&
        tmp?.pushtoken !== undefined &&
        tmp?.pushtoken !== ""
      ) {
        return {
          to: tmp.pushtoken,
          title: group.name,
          body: `${sender[0].name}: New message`,
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
  user
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
          attributes: ["status", "pushtoken"],
        },
      },
    ],
  });

  const sender = group?.users.filter((e) => e.id === senderId);

  const pushtoken =
    group?.users.map((usr) => {
      var tmp = usr.push_notification;
      if (
        usr.id !== user.id &&
        tmp?.status === "active" &&
        tmp?.pushtoken !== undefined &&
        tmp?.pushtoken !== ""
      ) {
        return {
          to: tmp.pushtoken,
          title: sender[0].name,
          body: "New message",
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
