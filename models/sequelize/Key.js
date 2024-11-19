const Key = function (sequelize, DataTypes) {
  return sequelize.define(
    "key",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      identityKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      signedPreKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      signaturePubKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
    },
    {
      tableName: "key",
      timestamps: true,
    }
  );
};

export default Key;
