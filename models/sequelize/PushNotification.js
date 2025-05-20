const PushNotification = function (sequelize, DataTypes) {
  return sequelize.define(
    "push_notification",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      pushtoken: {
        type: DataTypes.CHAR(80),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(12),
        defaultValue: "inactive",
      },
      lastNotificationTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "push_notification",
      timestamps: true,
    }
  );
};

export default PushNotification;
