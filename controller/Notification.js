import { Op } from "sequelize";

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
