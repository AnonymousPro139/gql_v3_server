const Error = function (sequelize, DataTypes) {
  return sequelize.define(
    "error",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      file: {
        type: DataTypes.STRING(50),
        defaultValue: false,
      },
      statusCode: {
        type: DataTypes.INTEGER,
        defaultValue: null
      },
      user_id: {
        type: DataTypes.INTEGER,
        defaultValue: null
      }

    },
    {
      tableName: "error",
      timestamps: true,
    }
  );
};

export default Error;
