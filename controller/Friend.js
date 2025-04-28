import { Op } from "sequelize";
// GraphQL
export const createFriend = async (sender_userId, target_userId, models) => {
  return await models.friend.create({
    userId: sender_userId,
    friendId: target_userId,
  });
};

export const getFriend = async (candidate_userId, friendId, models) => {
  // Нөгөө талд нь бас шалгах, Ө.х userId, friendId 2н байрыг сольж шалгах
  return await models.friend.findOne({
    where: {
      userId: candidate_userId,
      friendId,
    },
  });
};

export const checkFriends = async (userId, friendId, models) => {
  // userId-с friendId-руу request явуулсан эсэх
  const isSentReq = await models.friend.findOne({
    where: {
      userId,
      friendId,
    },
  });
  // friendId-с userId-руу request явуулсан эсэх
  const isReceivedReq = await models.friend.findOne({
    where: {
      userId: friendId,
      friendId: userId,
    },
  });

  if (!isSentReq && !isReceivedReq) {
    return false;
  }

  return true;
};

export const updateFriend = async (friends, isAllow) => {
  await friends.update({ isFriend: isAllow });
  await friends.save();
  return;
};

export const deleteFriend = async (friends) => {
  await friends.destroy();
  return;
};
export const unFriend = async (friendId, groupId, channelId, user, models) => {
  console.log("UNFRIEND friendId, groupId, chId", friendId, groupId, channelId);

  await models.sequelize.transaction(async (transaction) => {
    await models.friend.destroy(
      {
        where: {
          [Op.or]: [
            {
              friendId,
              userId: user.id,
              isFriend: true,
            },
            {
              friendId: user.id,
              userId: friendId,
              isFriend: true,
            },
          ],
        },
      },
      { transaction }
    );
    await models.member.destroy(
      {
        where: {
          [Op.or]: [
            {
              groupId,
              userId: user.id,
            },
            {
              groupId,
              userId: friendId,
            },
          ],
        },
      },
      { transaction }
    );

    await models.group.destroy(
      {
        where: {
          id: groupId,
        },
      },
      { transaction }
    );
    await models.channel.destroy(
      {
        where: {
          id: channelId,
        },
      },
      { transaction }
    );

    await models.notification.create(
      {
        type: "unfriend",
        myId: user.id,
        userId: friendId,
      },
      { transaction }
    );
  });

  return true;
};

export const myFriends = async (userId, models) => {
  // friend дээрээс userId-р хайгаад таарсан friendId-тай users-г өгнө
  var friends = await models.friend.findAll({
    where: {
      userId,
      // [or]: [{ userId: userId }, { friendId: userId }],
      isFriend: true,
    },
    include: [
      {
        model: models.user,
        as: "userFriends",
      },
    ],
  });
  friends = friends.map((user) => user?.userFriends);

  // friend дээрээс friendId-р хайгаад таарсан userId-тай users-г өгнө
  var anotherFriends = await models.friend.findAll({
    where: {
      friendId: userId,
      isFriend: true,
    },
    include: [
      {
        model: models.user,
        as: "friends",
      },
    ],
  });
  anotherFriends = anotherFriends.map((user) => user?.friends);

  const allFriends = friends.concat(anotherFriends);

  // Давхацсан users очиж болно, client тал нь шалгах
  return allFriends;
};
