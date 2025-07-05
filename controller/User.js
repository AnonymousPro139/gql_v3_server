import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { Sha256 } from "@aws-crypto/sha256-js";
import DeviceDetector from "node-device-detector";

import requestIP from "request-ip";
import { GraphQLError } from "graphql";
import { v5 as uuidv5 } from "uuid";
import { Op } from "sequelize";
import MyError from "../utils/myError.js";
import { getJWT, checkPassword } from "../utils/jwt.js";
import db from "../config/db_mysql.js";
import { throwBadRequest } from "../utils/Error.js";
import { decrypt } from "../utils/crypto.js";

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

export const login = asyncHandler(async (req, res, next) => {
  if (!req.body.phone || !req.body.password) {
    throw new MyError("Phone or password incorrect", 400);
  }

  // decrypt data
  const decPhone = decrypt(req.body.phone);
  const decPassword = decrypt(req.body.password);

  const user = await db.user.findOne({
    where: { phone: decPhone, status: "active" },
  });

  if (!user) {
    throw new MyError("Phone or password incorrect (or blocked)!", 401);
  }

  const ok = await checkPassword(decPassword, user.password);
  if (!ok) {
    throw new MyError("Phone or password incorrect!!", 401);
  }

  const data = await db.avatar.findOne({
    where: {
      userId: user.id,
    },
    attributes: ["avatar_link"],
  });

  const token = getJWT(
    user.id,
    user.lid,
    user.role,
    user.name,
    data.avatar_link,
    user.phone
  );

  delete user.dataValues["password"];
  delete user.dataValues["resetPasswordToken"];
  delete user.dataValues["resetPasswordExpire"];
  delete user.dataValues["status"];
  // delete user.dataValues["role"];

  // Өмнө нь логин хийгээгүй буюу анх бүртгүүлж буй хэрэглэгч байвал key-үүдийг авна.
  const loginCheck = await db.log.findOne({
    where: {
      type: "login",
      userId: user.id,
    },
  });

  let isFirstLogin = false;
  if (!loginCheck) {
    isFirstLogin = true;
  }

  var clientInfo = detector.detect(req.headers["user-agent"]);

  await db.log.create({
    type: "login",
    info:
      JSON.stringify(clientInfo.os) + JSON.stringify(clientInfo.client) ??
      "no-info",
    userId: user.id,
    device: JSON.stringify(clientInfo.device) ?? "no-device",
    ipAddress: requestIP.getClientIp(req),
  });

  await db.notification.create({
    type: "login",
    info: JSON.stringify(clientInfo.device),
    myId: user.id,
    userId: user.id,
  });

  const cookieOption = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), //  Тухайн browser eswel cookie hadgalj bga gazart ene token-g ene hugatsaand hadgalaad, nadruu ywuulj bgarai gj bna
    httpOnly: true, // server talaas l tuhain cookie-tei ajillana, cleint talaas JS-r eneruu handaj chadku bolno gsn ug
  };

  res.status(200).cookie("token", token, cookieOption).json({
    success: true,
    data: user,
    avatar: data.avatar_link,
    isFirstLogin,
    token,
  });
});
export const register = asyncHandler(async (req, res, next) => {
  if (
    !req.body.name ||
    !req.body.phone ||
    !req.body.email ||
    !req.body.password
  ) {
    throw new MyError("Pass the arguments!", 400);
  }

  const decEmail = decrypt(req.body.email);
  const decPhone = decrypt(req.body.phone);

  let check = await db.user.findOne({ where: { email: decEmail } });

  if (check) {
    throw new MyError("Unable to register!", 401);
    return;
  }
  check = await db.user.findOne({ where: { phone: decPhone } });

  if (check) {
    throw new MyError("Unable to register!", 401);
  }

  const NAME_SPACE = "b38451d2-3268-4b3a-88b1-4f2fea6ef27d";
  req.body.lid = uuidv5(decPhone, NAME_SPACE);
  req.body.role = "user";

  // const user = await db.user.create(req.body);

  const user = await db.user.create({
    phone: decPhone,
    name: decrypt(req.body.name),
    email: decEmail,
    password: decrypt(req.body.password),
    lid: req.body.lid,
    role: req.body.role,
  });

  await db.avatar.create({
    userId: user.id,
  });

  var clientInfo = detector.detect(req.headers["user-agent"]);

  await db.log.create({
    type: "register",
    info:
      JSON.stringify(clientInfo.os) + JSON.stringify(clientInfo.client) ??
      "no-info",
    userId: user.id,
    device: JSON.stringify(clientInfo.device) ?? "no-device",
    ipAddress: requestIP.getClientIp(req),
  });

  res.status(200).json({
    success: true,
  });
});
export const logout = asyncHandler(async (req, res, next) => {
  if (req.query.uid) {
    console.log("uid", req.query.uid);
  }

  const cookieOption = {
    expires: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("token", null, cookieOption).json({
    success: true,
    data: "Logged out!",
  });
});

// GraphQL
export const getUsersGQL = async (models) => {
  const users = await db.user.findAll({
    include: {
      model: models.avatar,
      attributes: ["avatar_link"],
    },
  });

  return users.map((user) => {
    var tmp = user.dataValues;
    tmp.avatar = user.dataValues.avatar.avatar_link;

    return tmp;
  });
};

export const getUserGQL = async (id, models) => {
  const user = await models.user.findOne({
    where: { id: parseInt(id) },
    include: {
      model: models.avatar,
    },
  });

  return {
    ...user.dataValues,
    avatar: user.dataValues.avatar?.avatar_link ?? "",
  };
};

export const deleteUserGQL = async (id, models) => {
  const tmp = await models.user.findOne({ where: { id: id, role: "user" } });

  if (!tmp) {
    throw new GraphQLError("User not found!", {
      extensions: { code: "NOT FOUND" },
    });
  }

  // устгах
  await tmp.destroy();

  return tmp;
};

export const myRequestSentUsers = async (id, models) => {
  const friends = await models.friend.findAll({
    where: {
      userId: id,
      isFriend: false,
    },
    include: [
      {
        model: models.user,
        as: "userFriends",
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
    ],
  });

  return friends.map((user) => {
    var tmp = user?.userFriends;
    tmp.avatar = user?.userFriends?.avatar.avatar_link;
    return tmp;
  });
};

export const myReceivedRequestsUsers = async (id, models) => {
  const friends = await models.friend.findAll({
    where: {
      friendId: id,
      isFriend: false,
    },
    include: [
      {
        model: models.user,
        as: "friends",
        include: {
          model: models.avatar,
          attributes: ["avatar_link"],
        },
      },
    ],
  });

  return friends.map((user) => {
    var tmp = user?.friends ?? [];
    tmp.avatar = user?.friends?.avatar.avatar_link;
    return tmp;
  });
};
export const searchBy = async (id, value, models) => {
  value = value
    .replaceAll(" ", "")
    .replaceAll("/", "")
    .replaceAll("$", "")
    .trim()
    .toLowerCase();

  const user = await models.user.findAll({
    where: {
      id: { [Op.not]: id },
      name: {
        [Op.like]: `%${value}%`,
      },
    },
    include: {
      model: models.avatar,
      attributes: ["avatar_link"],
    },
  });

  return user.map((user) => {
    var tmp = user;
    tmp.avatar = user.avatar.avatar_link;
    return tmp;
  });
};

export const findChannelForUser = async (channelId, userId) => {
  const check = await db.user.findOne({
    where: {
      id: userId,
    },
    include: {
      model: db.group,
      where: {
        channelId,
      },
    },
  });

  if (!check) {
    return false;
  } else {
    return true;
  }
};

export const setAvatar = async (link, id, models) => {
  const check = await models.user.findOne({
    where: {
      id: id,
    },
  });

  if (!check) {
    throwBadRequest("User not found!");
  }

  const avatar = await models.avatar.findOne({
    where: {
      userId: id,
    },
  });

  if (!avatar) {
    throwBadRequest("Avatar record not found!");
  }

  // link = link.replaceAll("$", "");
  // link = link.replaceAll("/", "");
  // link = link.replaceAll(".", "");

  // if (link.length > 24) {
  //   link = link.slice(0, 23);
  // }
  // зорилго нь client талаас бүх зургуудыг нэрээр нь дураараа дуудахаас зайлсхийх
  // // Тухайн линкийг hash хийх
  // const salt = "$2b$08$Nq8LlxHDFl1lKM0tJfqeLO"; // await bcrypt.genSalt(8);

  // link = await bcrypt.hash(link, salt); // resultant hashes will be 60 characters long

  try {
    await avatar.update({ avatar_link: link, isAvatarSet: true });
    await avatar.save();
  } catch (error) {
    throwBadRequest("Error when set your avatar");
    console.log("setAvatar error: ", error);
  }

  return link;
};

export const getAvatar = async (id, models) => {
  const data = await models.avatar.findOne({
    where: {
      userId: id,
    },
  });

  if (!data) {
    throwBadRequest("Avatar does not exist for this user!");
  }

  return data.avatar_link;
};

export const setPublicKeys = async (
  IdPubKey,
  SpPubKey,
  SignaturePubKey,
  Signature,
  EphPubKey,
  models,
  user
) => {
  // 2 udaa uusgesen baihaas sergiileh
  const check = await models.key.findOne({
    where: {
      userId: user.id,
    },
  });

  if (check) {
    throwBadRequest("Keys created before!");
    return false;
  }

  await models.key.create({
    identityKey: IdPubKey,
    signedPreKey: SpPubKey,
    signaturePubKey: SignaturePubKey,
    signature: Signature,
    userId: user.id,
  });

  await models.ephkey.create({
    ephkey: EphPubKey,
    userId: user.id,
  });

  return true;
};

export const getPublicKeys = async (userId, models) => {
  if (!userId) {
    throwBadRequest("Pass the userId");
    return;
  }
  // хамгийн сүүлийн түлхүүрүүдийг ашиглаж байна, Хамгийн сүүлийн ганц түлхүүрийг авчирдаг болгож сайжруулах
  const tmp = await models.user.findOne({
    where: { id: userId },
    attributes: ["id", "lid", "name", "email", "phone", "role"],
    include: [
      {
        model: models.key,
      },
      {
        model: models.ephkey,
      },
    ],
  });

  if (!tmp || tmp.keys.length === 0) {
    throwBadRequest("Keys or user doesn't exists!");
    return;
  }

  return {
    user: tmp.dataValues,
    keys: {
      id: userId,
      IdPubKey: tmp.keys[tmp.keys.length - 1].identityKey,
      SpPubKey: tmp.keys[tmp.keys.length - 1].signedPreKey,
      SignaturePubKey: tmp.keys[tmp.keys.length - 1].signaturePubKey,
      Signature: tmp.keys[tmp.keys.length - 1].signature,
    },
    ephkey: {
      id: tmp.ephkeys[tmp.ephkeys.length - 1]?.id ?? "",
      userId: userId,
      ephkey: tmp.ephkeys[tmp.ephkeys.length - 1]?.ephkey ?? "",
    },
  };
};

export const checkPublicKeys = async (
  hashedIdPubKey,
  hashedSpPubKey,
  models,
  user
) => {
  if (!hashedIdPubKey || !hashedSpPubKey) {
    throwBadRequest("Pass the keys!");
    return;
  }
  // client talaas syncCode try tooloh

  const tmp = await models.user.findOne({
    where: { id: user.id },
    attributes: ["id"],
    include: [
      {
        model: models.key,
      },
    ],
  });

  if (!tmp.keys[0].identityKey || !tmp.keys[0].signedPreKey) {
    return false;
  }

  const hash = new Sha256();
  hash.update(tmp.keys[0]?.identityKey);
  const hashIdKey = byteArrayToHexString(await hash.digest());

  hash.reset();

  hash.update(tmp.keys[0]?.signedPreKey);
  const hashSPKey = byteArrayToHexString(await hash.digest());

  if (hashIdKey === hashedIdPubKey && hashSPKey === hashedSpPubKey) {
    return true;
  }

  return false;
};

const byteArrayToHexString = (byteArray) => {
  var hexString = "";
  var nextHexByte;

  for (var i = 0; i < byteArray.byteLength; i++) {
    nextHexByte = byteArray[i].toString(16); // Integer to base 16
    if (nextHexByte.length < 2) {
      nextHexByte = "0" + nextHexByte; // Otherwise 10 becomes just a instead of 0a
    }
    hexString += nextHexByte;
  }
  return hexString;
};

// gql_v4
export const setPushToken = async (pushtoken, models, user) => {
  const check = await models.push_notification.findOne({
    where: {
      userId: user.id,
    },
  });

  if (!check) {
    // шинээр үүсгэх
    await models.push_notification.create({
      pushtoken: pushtoken,
      status: "active",
      userId: user.id,
    });
    return true;
  } else {
    // байсан бол status-г нь pushtoken-той нь солих
    if (check.status !== "active") {
      await check.update({ status: "active", pushtoken: pushtoken });
      await check.save();

      return true;
    } else {
      return true;
    }
  }
};

export const removePushToken = async (models, user) => {
  console.log("REMOVE PUSH TOKEN---");
  const tmp = await models.push_notification.findOne({
    where: { userId: user.id, status: "active" },
  });

  if (tmp) {
    // устгах
    await tmp.destroy();
  }

  return true;
};
