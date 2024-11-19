const MessageReaction = function (sequelize, DataTypes) {
  return sequelize.define(
    "message_reaction",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      reaction: {
        type: DataTypes.ENUM("heart", "like", "unlike", "smile", "frown"),
        defaultValue: "heart",
      },
    },
    {
      tableName: "message_reaction",
      timestamps: false,
    }
  );
};

export default MessageReaction;
