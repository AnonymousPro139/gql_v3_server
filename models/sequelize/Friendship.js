const Friendship = function (sequelize, DataTypes) {
  return sequelize.define(
    "friend",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      // userId: {
      //   type: DataTypes.INTEGER(10).UNSIGNED,
      //   allowNull: false,
      //   references: {
      //     model: "user",
      //     key: "id",
      //   },
      // },

      // friendId: {
      //   type: DataTypes.INTEGER(10).UNSIGNED,
      //   allowNull: false,
      //   references: {
      //     model: "user",
      //     key: "id",
      //   },
      // },

      isFriend: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "friend",
    }
  );
};

export default Friendship;
