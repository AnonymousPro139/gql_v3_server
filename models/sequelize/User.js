import bcrypt from "bcrypt";

const User = function (sequelize, DataTypes) {
  return sequelize.define(
    "user",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      lid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(25),
        defaultValue: "no-name",
      },
      email: {
        type: DataTypes.STRING(35),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(16),
        defaultValue: "no-phone",
      },

      password: {
        type: DataTypes.CHAR(64),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "user"),
        defaultValue: "user",
      },
      status: {
        type: DataTypes.ENUM("active", "blocked"),
        defaultValue: "active",
      },
      resetPasswordToken: {
        type: DataTypes.STRING(64),
        defaultValue: "undefined",
      },

      resetPasswordExpire: {
        type: DataTypes.DATE,
        defaultValue: Date.now,
      },
    },
    {
      tableName: "user",
      timestamps: false,
      hooks: {
        beforeSave: async (user) => {
          if (!user.changed("password")) {
            // console.log("Санамж: Хэрэглэгчийн нууц үг өөрчлөгдөөгүй");
            return;
          }
          const salt = await bcrypt.genSalt(8);
          user.password = await bcrypt.hash(user.password, salt);
        },
      },

      indexes: [
        {
          unique: true,
          fields: ["lid"],
        },
        {
          unique: true,
          fields: ["email"],
        },
        {
          unique: true,
          fields: ["phone"],
        },
      ],
    }
  );
};

export default User;
