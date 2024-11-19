import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { throwUnauthenicated } from "./Error.js";

export const getJWT = (id, lid, role, name, avatar) => {
  const token = jwt.sign(
    {
      id: id,
      lid: lid,
      role: role,
      name: name,
      avatar: avatar,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );

  return token;
};
export const getViewFileJWT = (id, channelId, name) => {
  // 234_test123.png-567_schema.jpg --> [ '234_test123.png', '567_schema.jpg' ]--> [ '234', '567' ]
  var tmp = name.split("-").map((e) => e.split("_")[0]);

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
