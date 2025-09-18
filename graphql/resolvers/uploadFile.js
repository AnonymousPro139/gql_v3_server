import { finished } from "stream/promises";
import fs from "fs";
import path from "path";
import MyError from "../../utils/myError.js";
import { throwBadRequest, throwUnauthenicated } from "../../utils/Error.js";

export default {
  Mutation: {
    singleUpload: async (root, { file }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!file) {
        throwUnauthenicated();
        return;
      }

      const { createReadStream, filename, mimetype, encoding } = await file;

      const tmp = path.join("uploads", filename);

      const stream = createReadStream();
      const out = fs.createWriteStream(tmp);

      stream.pipe(out);
      await finished(out);

      return { filename, mimetype, encoding };
    },

    multipleUpload: async (
      root,
      { files, channelId },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!files || !channelId) {
        throwBadRequest();
        return;
      }

      var res = null;
      try {
        res = files.map(async (file) => {
          var tmpName = "";
          const { createReadStream, filename, mimetype, encoding } = await file;

          tmpName = filename
            .replaceAll("-", "_")
            .replaceAll(" ", "")
            .replaceAll("?", "")
            .trim();

          const now = Date.now().toString();
          const salt = Math.random().toString().slice(2, 7); // random string

          const date = new Date();
          const GENERAL_PATH = "uploads/";
          // /year/month/channelId
          const createdPath = `${date.getFullYear()}/${
            date.getMonth() + 1
          }/${channelId}`;

          // file name format : timestamp_channelId_fromUserId_salt.extension
          const fname =
            now +
            "_" +
            channelId +
            "_" +
            user.id +
            "_" +
            salt +
            "." +
            tmpName.split(".")[tmpName.split(".").length - 1];

          fs.mkdir(
            GENERAL_PATH + createdPath,
            { recursive: true },
            (err, path) => {
              if (path !== undefined) {
                console.log("Created new directory in uploads/: ", path);
              }
            }
          );

          const tmp = path.join(GENERAL_PATH + createdPath, fname);

          const stream = createReadStream();

          stream.on("error", (err) => {
            // throw new MyError("Failed to upload the image");
            console.log("Error! [Failed to upload the image]", err);
          });

          const out = fs.createWriteStream(tmp);

          stream.pipe(out);
          await finished(out)
            .then(() => {})
            .catch((err) => {
              console.log("hahhaha nono error:", err);
              throw new MyError("oho nono ", 401);
            });

          return {
            filename: createdPath + "/" + fname,
            mimetype,
            encoding,
          };
        });
      } catch (err) {
        console.log("Multiple upload error: ", err);
        return {
          success: false,
          file: null,
        };
      }

      return {
        success: true,
        file: res,
      };
    },
  },
};
