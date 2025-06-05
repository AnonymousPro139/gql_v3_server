import asyncHandler from "express-async-handler";
import { Op, where } from "sequelize";
import { throwBadRequest } from "../utils/Error.js";
import { getViewFileJWT } from "../utils/jwt.js";
import db from "../config/db_mysql.js";
import Message from "../models/mongodb/message.js";

// using in middleware in file protect
export const isExistFileMessage = asyncHandler(async (channelId, name) => {
  const check = await db.message.findOne({
    where: {
      isFile: true,
      channelId: channelId,
      text: {
        [Op.like]: `%${decodeURI(name)}%`,
      },
    },
  });

  if (!check) {
    return false;
  }
  return true;
});
const checkChannelAccess = async (channelId, userId, models) => {
  return await models.group.findOne({
    where: {
      channelId,
    },

    include: [
      {
        model: models.user,
        where: {
          id: userId,
        },
      },
      {
        model: models.channel,
        attributes: ["dm"],
      },
    ],
  });
};
// GraphQL
export const createMessage = async (
  channelId,
  msgKey,
  text,
  isInfo = false,
  models,
  user
) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("You're not in this channel!");
    return;
  }

  const eph = await models.ephkey.findOne({
    where: {
      userId: user.id,
    },
    attributes: ["id"],
    order: [["createdAt", "DESC"]],
  });

  // sanitize text, msgkey

  // MongoDB!
  // await Message.create({
  //   userID: "6423eb8c06d7f29d343c1ac9",
  //   senderID: "6423ebca06d7f29d343c1ad0",
  //   title: "test_",
  //   message: "Snuuu",
  //   read: false,
  // });

  return await models.message.create({
    text: text,
    userId: user.id,
    channelId: channelId,
    msgKey: msgKey,
    dm: check.channel.dm,
    ephkeyId: eph.id,
    isInfo: isInfo,
  });
};
export const createFileMessage = async (
  channelId,
  msgKey,
  text,
  models,
  user
) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("You are not in this channel!");
    return;
  }

  // 234_test123.png-567_schema.jpg
  // text ni deerh formattai bh estoi!

  // File access хийх үед шалгах зорилготой токен
  const fileViewToken = getViewFileJWT(user.id, channelId, text); // expiredIn bolbol ??

  return await models.message.create({
    isFile: true,
    fileViewToken: fileViewToken,
    text: text,
    msgKey: msgKey,
    userId: user.id,
    channelId: channelId,
    dm: check.channel.dm,
  });
};
export const unsendMessage = async (channelId, messageId, models, user) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("Why are you in this channel!");
    return;
  }

  return await models.message.update(
    { isDeleted: true },
    {
      where: {
        id: messageId,
        channelId,
        userId: user.id,
        isDeleted: false,
      },
    }
  );
};
export const seenMessage = async (channelId, messageId, models, user) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("Why are you in this channel!");
    return;
  }
  return await models.message_seen.create({
    seen: true,
    messageId,
    channelId,
    userId: user.id,
  });
};
export const seenChannelMessages = async (channelId, limit, models, user) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("Why are you in this channel!");
    return;
  }

  // Тухайн channel-н хамгийн сүүлийн limit ширхэг sms-ыг seen bolgoh
  const msgs = await models.message.findAll({
    where: {
      channelId,
    },
    attributes: ["id"],
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: 0,
  });

  var Obj = msgs?.map((e) => {
    return {
      messageId: e.id,
      channelId,
      userId: user.id,
      seen: true,
    };
  });

  if (Obj.length > 0) {
    await models.message_seen.bulkCreate(Obj, {
      ignoreDuplicates: true,
    });
  }

  return true;
};
export const reactionMessage = async (
  channelId,
  messageId,
  reaction,
  models,
  user
) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("You can't access in this channel!");
    return;
  }

  var react = await models.message_reaction.findOne({
    where: {
      messageId,
      userId: user.id,
    },
  });

  if (react?.reaction === reaction) {
    return null;
  }

  if (!react) {
    react = await models.message_reaction.create({
      messageId: messageId,
      userId: user.id,
      reaction: reaction,
    });
  } else {
    await react.update({ reaction });
    react = await react.save();
  }

  return react;
};
export const getMessages = async (channelId, offset, limit, models, user) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("You are not in this channel!");
    return;
  }

  console.log("GET MESSAGES channelId:", channelId);
  const messages = await models.message.findAll({
    where: {
      channelId: channelId,
      // isDeleted: false
    },
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
    include: [
      {
        model: models.user,
        attributes: ["name"],
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
      {
        model: models.message_seen,
        required: false,
        attributes: ["userId"],
        where: {
          seen: true,
        },
        include: {
          model: models.user,
          include: {
            model: models.avatar,
            attributes: ["avatar_link"],
          },
        },
      },
      {
        model: models.message_reaction,
        required: false,
        attributes: ["reaction"],
        include: {
          model: models.user,
          include: {
            model: models.avatar,
            attributes: ["avatar_link"],
          },
        },
      },
    ],
  });

  return messages.map((msg) => {
    var tmp = msg;
    tmp.avatar = msg.user.avatar?.avatar_link ?? "no-link";
    tmp.seen =
      msg.message_seens?.map((e) => {
        var data = e.user;
        data.avatar = e.user.avatar?.avatar_link ?? null;

        return data;
      }) ?? [];
    tmp.reaction =
      msg.message_reactions?.map((e) => {
        var data = e.user;
        data.avatar = e.user.avatar?.avatar_link ?? null;

        return {
          reaction: e.reaction,
          user: data,
        };
      }) ?? [];

    tmp.name = msg.user.name;
    return tmp;
  });
};
export const getMediaFiles = async (channelId, offset, limit, models, user) => {
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("You are not in this channel!");
    return;
  }

  const msgs = await models.message.findAll({
    where: {
      channelId: channelId,
      isFile: true,
      isDeleted: false,
    },
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
    include: [
      {
        model: models.user,
        attributes: ["name"],
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
    ],
  });

  return msgs.map((msg) => {
    var tmp = msg;
    tmp.avatar = msg.user.avatar?.avatar_link ?? "no-link";
    tmp.name = msg.user.name;
    return tmp;
  });
};
export const getLastMessage = async (channelId, models, user) => {
  // tuhain channelid-d handah erhtei hun eseh shalgah
  const check = await checkChannelAccess(channelId, user.id, models);

  if (!check) {
    throwBadRequest("Та энэ channel-д байхгүй байна");
    return;
  }

  var msg = await models.message.findOne({
    where: {
      channelId: channelId,
    },
    order: [["createdAt", "DESC"]],

    include: [
      {
        model: models.message_seen,
        required: false,
        attributes: ["userId"],
        where: {
          seen: true,
        },
        include: {
          model: models.user,
          include: {
            model: models.avatar,
            attributes: ["avatar_link"],
          },
        },
      },
      {
        model: models.message_reaction,
        required: false,
        attributes: ["reaction"],
        include: {
          model: models.user,
          include: {
            model: models.avatar,
            attributes: ["avatar_link"],
          },
        },
      },
    ],
  });

  const seenUsers =
    msg?.message_seens.map((e) => {
      var data = e.user;
      data.avatar = e.user.avatar?.avatar_link ?? null;

      return data;
    }) ?? [];

  const reactedUsers = msg?.message_reactions.map((e) => {
    var data = e.user;
    data.avatar = e.user.avatar?.avatar_link ?? null;

    return {
      reaction: e.reaction,
      user: data,
    };
  });

  if (msg !== null) {
    msg.seen = seenUsers;
    msg.reaction = reactedUsers;
  }

  return msg;
};
