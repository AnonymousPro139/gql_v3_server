import { finished } from "stream/promises";
import fs from "fs";
import path from "path";
import MyError from "../../utils/myError.js";
import { throwUnauthenicated } from "../../utils/Error.js";

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

    multipleUpload: async (root, { files }, { models, token, user }) => {
      console.log("iishee orloo");
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!files) {
        throwUnauthenicated();
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

          const salt = Math.random().toString().slice(2, 7); // random string

          tmpName =
            tmpName.split(".")[0].slice(0, 24) +
            "_" +
            salt +
            "." +
            tmpName.split(".")[tmpName.split(".").length - 1];

          tmpName = Math.random().toString().slice(2, 5) + "_" + tmpName;

          const tmp = path.join("uploads", tmpName);

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
              console.log(err);
              throw new MyError("oho nono ", 401);
            });

          return { filename: tmpName, mimetype, encoding };
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
