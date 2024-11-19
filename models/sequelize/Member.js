const Member = function (sequelize, DataTypes) {
  return sequelize.define(
    "member",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "member",
    }
  );
};

export default Member;
