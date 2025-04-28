import { Sequelize } from "sequelize";
// import path from "path"
// import {} from "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

import User from "../models/sequelize/User.js";
import Channel from "../models/sequelize/Channel.js";
import Message from "../models/sequelize/Message.js";
import Group from "../models/sequelize/Group.js";
import Member from "../models/sequelize/Member.js";
import Error from "../models/sequelize/Error.js";
import Friendship from "../models/sequelize/Friendship.js";
import MessageSeen from "../models/sequelize/MessageSeen.js";
import MessageReaction from "../models/sequelize/MessageReaction.js";
import Avatar from "../models/sequelize/Avatar.js";
import Notification from "../models/sequelize/Notification.js";
import Log from "../models/sequelize/Log.js";
// // энэ-г v3 дээр нэмэв: Deerh log ntrtei holboh
import Key from "../models/sequelize/Key.js";
import EphKey from "../models/sequelize/EphKey.js";

// // энэ-г v4 дээр нэмэв
import PushNotification from "../models/sequelize/PushNotification.js";

// import { Sequelize } from "sequelize";
var db = {};

const sequelize = new Sequelize(
  process.env.SEQUELIZE_DATABASE,
  process.env.SEQUELIZE_USER,
  process.env.SEQUELIZE_USER_PASSWORD,
  {
    // host: "mysqldb",
    host: process.env.SEQUELIZE_HOST,
    port: process.env.SEQUELIZE_PORT,
    dialect: process.env.SEQUELIZE_DIALECT,
    define: {
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },

    operatorAliases: false,
    logging: false,
  }
);

const models = [
  User,
  Channel,
  Message,
  Group,
  Member,
  Error,
  Friendship,
  MessageSeen,
  MessageReaction,
  Avatar,
  Notification,
  Log,
  Key,
  EphKey,
  PushNotification,
];

models.forEach((model) => {
  const seqModel = model(sequelize, Sequelize);
  db[seqModel.name] = seqModel;
});

db.sequelize = sequelize;

export default db;
