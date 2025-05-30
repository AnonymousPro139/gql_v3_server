import { removePushToken, setPushToken } from "../../controller/User.js";
import { throwBadRequest, throwUnauthenicated } from "../../utils/Error.js";

export default {
  Mutation: {
    setPushToken: async (root, { pushtoken }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return false;
      }

      if (!pushtoken) {
        throwBadRequest();
        return false;
      }

      try {
        await setPushToken(pushtoken, models, user);
        return true;
      } catch (err) {
        console.log("error setPushToken:", err);
        return false;
      }
    },
    removePushToken: async (root, {}, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return false;
      }

      try {
        return await removePushToken(models, user);
      } catch (err) {
        console.log("error removePushToken:", err);
        return false;
      }
    },
  },
};
