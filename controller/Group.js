import { Op } from "sequelize";
import { throwBadRequest } from "../utils/Error.js";

// GraphQL
export const createGroup = async (channelId, name, transaction, models) => {
  return await models.group.create({ name, channelId }, { transaction });
};
export const createPrivateGroup = async (channelId, transaction, models) => {
  return await models.group.create(
    { name: "private", channelId },
    { transaction }
  );
};

export const getGroups = async (models, id) => {
  const user = await models.user.findOne({
    where: {
      id,
    },
    include: {
      model: models.group,
      where: {
        name: { [Op.not]: "private" },
      },
    },
  });

  return user?.groups ?? null;
};

export const getAllGroups = async (models) => {
  const groups = await models.group.findAll({
    where: {
      name: { [Op.not]: "private" },
    },
  });

  return groups ?? null;
};

export const getPrivateGroups = async (models, id) => {
  const user = await models.user.findOne({
    where: {
      id,
    },
    include: {
      model: models.group,
      where: {
        name: "private",
      },
      include: {
        model: models.user,
        where: {
          id: { [Op.not]: id },
        },

        include: [
          {
            model: models.avatar,
            attributes: ["avatar_link"],
          },
          {
            model: models.key,
          },
          {
            model: models.ephkey,
            attributes: ["id", "ephkey", "userId", "createdAt"],
          },
        ],
      },
    },
  });

  return (
    user?.groups.map((el) => {
      var tmp = el.dataValues.users[0];
      tmp.avatar = tmp.avatar.avatar_link;

      return {
        group: el.dataValues,
        user: tmp,
        keys: {
          id: tmp?.keys[0]?.id ?? 0,
          IdPubKey: tmp?.keys[0]?.identityKey ?? "",
          SpPubKey: tmp?.keys[0]?.signedPreKey ?? "",
          SignaturePubKey: tmp?.keys[0]?.signaturePubKey ?? "",
          Signature: tmp?.keys[0]?.signature ?? "",
        },
        ephkey: {
          id: tmp?.ephkeys[tmp.ephkeys.length - 1]?.id ?? 0,
          userId: tmp?.ephkeys[tmp.ephkeys.length - 1]?.userId ?? 0,
          ephkey: tmp?.ephkeys[tmp.ephkeys.length - 1]?.ephkey ?? "",
        },
      };
    }) ?? null
  );
};

export const getGroupWithMembers = async (groupId, userId, models) => {
  // Тухайн user энэ групп-т байгаа эсэхийг шалгах
  const check = await models.member.findOne({
    where: {
      userId,
      groupId,
    },
  });

  if (!check) {
    throwBadRequest("You are not in this group!");
    return;
  }

  const group = await models.group.findOne({
    where: {
      id: groupId,
    },
    include: [
      {
        model: models.user,
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
    ],
  });

  const admins = await models.member.findAll({
    where: {
      groupId,
      isAdmin: true,
    },
    attributes: ["userId"],
  });

  // return group.users;
  const users = group?.users.map((el) => {
    var tmp = el.dataValues;
    tmp.avatar = el.avatar.avatar_link;

    return tmp;
  });

  return {
    users: users,
    adminId: admins?.map((e) => e.userId) || [],
  };
};
export const getGroupWithMembersAdmin = async (groupId, models) => {
  const group = await models.group.findOne({
    where: {
      id: groupId,
    },
    include: {
      model: models.user,
      include: {
        model: models.avatar,
        attributes: ["avatar_link"],
      },
    },
  });

  return group?.users.map((el) => {
    var tmp = el.dataValues;
    tmp.avatar = el.avatar.avatar_link;

    return tmp;
  });
};

export const removeUserFromGroup = async (
  groupId,
  userId,
  groupName,
  models,
  user
) => {
  const isAdmin = await models.member.findOne({
    where: { groupId, userId: user.id, isAdmin: true },
  });

  if (!isAdmin) {
    throwBadRequest("You are not admin!");
    return false;
  }

  try {
    await models.member.destroy({
      where: {
        groupId,
        userId: userId,
      },
    });

    await models.notification.create({
      type: "removedFromGroup",
      myId: user.id,
      userId,
      info: groupName,
    });

    return true;
  } catch (err) {
    console.log("error removeUserFromGroup:", err);
    return false;
  }
};
export const leftGroup = async (groupId, groupName, models, user) => {
  const isAdmin = await models.member.findOne({
    where: { groupId, userId: user.id, isAdmin: true },
  });

  // admin baiwal tuhain group-n oor neg gishuunig admin bolgood ooriig n left bolgoh
  if (isAdmin) {
    const anotherMember = await models.member.findOne({
      where: {
        groupId,
        userId: { [Op.not]: user.id },
      },
    });

    if (anotherMember) {
      await anotherMember.update({ isAdmin: true });
      await anotherMember.save();
    }
  }

  try {
    await models.member.destroy({
      where: {
        groupId,
        userId: user.id,
      },
    });

    await models.notification.create({
      type: "leftGroup",
      myId: user.id,
      userId: user.id,
      info: groupName,
    });

    return true;
  } catch (err) {
    console.log("error leftGroup:", err);
    return false;
  }
};

export const changeUpdatedAtGroup = async (channelId, updatedAt, models) => {
  // const group = await models.group.findOne({
  //   where: {
  //     channelId: channelId,
  //   },
  // });

  // // console.log("group.updatedAt:", group.updatedAt);
  // // console.log("updatedAt", updatedAt);
  // // console.log('converted', new Date(updatedAt));
  // group.updatedAt = new Date(updatedAt);
  // await group.save({ silent: true });

  // console.log("group", group);

  // await group.update({ updatedAt: updatedAt });
  // await group.save();

  // console.log("grup2", group);

  const [updatedCount] = await models.group.update(
    { updated_at: updatedAt },
    { where: { channelId: channelId }, silent: true }
  );

  console.log("count:", updatedCount);

  return;
};
