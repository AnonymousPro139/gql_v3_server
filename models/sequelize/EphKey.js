const EphKey = function (sequelize, DataTypes) {
  return sequelize.define(
    "ephkey",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      ephkey: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
    },
    {
      tableName: "ephkey",
      timestamps: true,
    }
  );
};

export default EphKey;
