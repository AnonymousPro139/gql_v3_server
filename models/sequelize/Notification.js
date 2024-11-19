const Notification = function (sequelize, DataTypes) {
  return sequelize.define(
    "notification",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      info: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          "system",
          "unfriend",
          "friend",
          "friendRequest",
          "cancelRequest",
          "leftGroup",
          "removedFromGroup",
          "addedGroup",
          "login"
        ),
        defaultValue: "friend",
      },
    },
    {
      tableName: "notification",
      timestamps: true,
    }
  );
};

export default Notification;
