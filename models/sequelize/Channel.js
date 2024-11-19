const Channel = function (sequelize, DataTypes) {
  return sequelize.define(
    "channel",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(24),
        allowNull: false,
      },
      dm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "channel",
    }
  );
};

export default Channel;
