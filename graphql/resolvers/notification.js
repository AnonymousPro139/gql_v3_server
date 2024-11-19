import { myNotifications } from "../../controller/Notification.js";
import { throwUnauthenicated } from "../../utils/Error.js";

export default {
  Query: {
    myNotifications: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return myNotifications(models, user);
    },
  },

  Mutation: {},
};
