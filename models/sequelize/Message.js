const Message = function (sequelize, DataTypes) {
  return sequelize.define(
    "message",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      msgKey: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      isInfo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFile: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isView: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      dm: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      fileViewToken: {
        type: DataTypes.STRING(300),
        defaultValue: "undefined",
      },
    },
    {
      tableName: "message",

      indexes: [
        // {
        //   unique: false,
        //   fields: ["text"],
        // },
        {
          unique: false,
          fields: ["fileViewToken"],
        },
      ],
    }
  );
};

export default Message;
