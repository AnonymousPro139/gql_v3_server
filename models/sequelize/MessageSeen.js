const MessageSeen = function (sequelize, DataTypes) {
  return sequelize.define(
    "message_seen",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "message_seen",
      timestamps: false,
    }
  );
};

export default MessageSeen;
