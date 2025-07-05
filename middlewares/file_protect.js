import expressAsyncHandler from "express-async-handler";
import { isExistFileMessage } from "../controller/Message.js";
import { verifyViewFileJWT, verifyJWT } from "../utils/jwt.js";
import MyError from "../utils/myError.js";

export const file_protect = expressAsyncHandler(async (req, res, next) => {
  // console.log("PROTECT:", req.query);
  // console.log("+++:", req.protocol, req.get("host"), req.url, req.originalUrl);

  // End tuhain hereglegchiiiin token-g shalgaj ywuulmaar bna, Odoogooor ogt token-gui hun c duudaj chadaj bna, ghde encrypted data awna

  if (!req.query.fileViewToken) {
    throw new MyError("Not accessed", 401);
    return;
  }

  var data = null;
  try {
    data = verifyViewFileJWT(req.query.fileViewToken);
  } catch (err) {
    throw new MyError("Not accessed (Invalid Signature)", 401);
  }

  // Tuhain file-n url ni data.name-d bga file mun eseh, Ө.х ямар ч хамаагүй файлыг нэг fileViewToken-р авах боломжийг хаах
  const pathUrl = req.originalUrl.split("?")[0]; //  --> /uploads/123_test.png
  const fileName = pathUrl.split("/")[pathUrl.split("/").length - 1]; // --> 123_test.png

  // fileName is --> 1749002652270_179_8_23000.jpg --> 1749002652270_179_8_23000
  // 1749002652270_179_8_23000,1749002652277_179_8_25171 endeees 1749002652270_179_8_23000 eniiig haina

  if (data.name.indexOf(fileName.split(".")[0]) === -1) {
    throw new MyError("Not accessed.", 401);
  }

  const check = await isExistFileMessage(data.cId, fileName);

  if (check === false) {
    throw new MyError("Not accessed..", 401);
  }

  next();
});

export const checkToken = (req, res, next) => {
  let token = null;

  // console.log("---------");
  // console.log(req.headers);

  // Зөвхөн манай энэ хаягнаас хандана гэх үед нээх
  //   if (req.headers.origin !== "http://localhost:3000") {
  //     throw new MyError("Not allowed address", 401);
  //   }

  if (req.headers && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    // cookie-s огт уншихгүй байгаа тул хаая
    // if (req.cookies) {---
    //   token = req.cookies["token"];
    // }
  }

  if (!token) {
    throw new MyError("Permission denied", 401);
    return;
  }

  const data = verifyJWT(token);

  req.userId = data.id;
  req.userRole = data.role;

  next();
};
