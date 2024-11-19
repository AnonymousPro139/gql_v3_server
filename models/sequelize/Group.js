const Group = function (sequelize, DataTypes) {
  return sequelize.define(
    "group",
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
      
    },
    {
      tableName: "group",
    }
  );
};

export default Group;
