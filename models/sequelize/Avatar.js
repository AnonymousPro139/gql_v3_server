const Avatar = function (sequelize, DataTypes) {
  return sequelize.define(
    "avatar",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      avatar_link: {
        type: DataTypes.STRING(70),
        defaultValue: "no-link",
      },
      isAvatarSet: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "avatar",
      timestamps: false,
    }
  );
};

export default Avatar;
