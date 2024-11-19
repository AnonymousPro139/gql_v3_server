const Log = function (sequelize, DataTypes) {
  return sequelize.define(
    "log",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      info: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          "register",
          "login",
          "logout",
          "delete",
          "change",
          "try"
        ),
        defaultValue: "login",
      },
      ipAddress: {
        type: DataTypes.STRING(50), // IPv6 -> 39
        defaultValue: "no-ip",
      },
      device: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    {
      tableName: "log",
      timestamps: true,
    }
  );
};

export default Log;
