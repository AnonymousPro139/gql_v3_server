import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { throwUnauthenicated } from "./Error.js";

export const getJWT = (id, lid, role, name, avatar, phone) => {
  const token = jwt.sign(
    {
      id: id,
      lid: lid,
      role: role,
      name: name,
      avatar: avatar,
      phone: phone,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );

  return token;
};
export const getViewFileJWT = (id, channelId, name) => {
  // 2025/6/179/1748997297017_179_16_42379.avif-2025/6/179/1748997297018_179_16_41021.PNG-2025/6/179/1748997297022_179_16_02902.PNG  -->
  // [2025/6/179/1748997297017_179_16_42379.avif, 2025/6/179/1748997297018_179_16_41021.PNG, 2025/6/179/1748997297022_179_16_02902.PNG] -->
  // [1748997297017_179_16_42379, 1748997297018_179_16_41021, 1748997297022_179_16_02902 ]

  var tmp = name.split("-").map((e) => {
    var name = e.split("/")[e.split("/").length - 1];

    return name.split(".")[0];
    // return e.split("_")[0]; // ehendee iim bdag bsn
  });

  const token = jwt.sign(
    {
      id: id,
      cId: channelId,
      name: tmp.toString(),
    },
    process.env.JWT_VIEW_FILE_SECRET,
    {
      expiresIn: "60d",
    }
  );

  return token;
};

export const decodeJWT = (token) => {
  return jwt.decode(token, process.env.JWT_SECRET);
};

export const verifyJWT = (token) => {
  if (!token || token === "") {
    throwUnauthenicated();
    return;
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyViewFileJWT = (token) => {
  if (!token || token == "") {
    throwUnauthenicated();
    return;
  }

  return jwt.verify(token, process.env.JWT_VIEW_FILE_SECRET);
};
export const checkPassword = async (enteredPass, truePass) => {
  return await bcrypt.compare(enteredPass, truePass);
};
