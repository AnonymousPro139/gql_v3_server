import {
  getUsersGQL,
  getUserGQL,
  deleteUserGQL,
  myRequestSentUsers,
  myReceivedRequestsUsers,
  searchBy,
  setAvatar,
  getAvatar,
  setPublicKeys,
  getPublicKeys,
  checkPublicKeys,
} from "../../controller/User.js";

import { throwUnauthenicated, throwBadRequest } from "../../utils/Error.js";
import { isAdmin } from "../../utils/functions.js";

export default {
  Query: {
    getUsers: async (root, args, { models, token, user }) => {
      // user = null гэдэг нь цаанаас токен дамжиж ирээгүй эсвэл буруу токен
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      await isAdmin(user, models);

      return getUsersGQL(models);
    },

    User: (root, { id }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!id) {
        throwBadRequest("ID is required");
      }

      return getUserGQL(id, models);
    },

    myRequestSentUsers: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return myRequestSentUsers(user.id, models);
    },

    myReceivedRequestsUsers: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return myReceivedRequestsUsers(user.id, models);
    },

    searchBy: (root, { value }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!value) {
        throwBadRequest();
        return;
      }

      return searchBy(user.id, value, models);
    },

    getAvatar: (root, args, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      return getAvatar(user.id, models);
    },

    getPublicKeys: (root, { userId }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!userId) {
        throwBadRequest();
        return;
      }

      return getPublicKeys(userId, models);
    },
  },

  Mutation: {
    deleteUser: async (root, { id }, { models, token, user, ip }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      await isAdmin(user, models);
      // устсан хэрэглэгчдийн log хөтлөх
      await models.log.create({
        type: "delete",
        info: "Deleted userid:  " + id,
        userId: user.id,
        device: "no-device",
        ipAddress: ip,
      });

      return deleteUserGQL(id, models);
    },

    setAvatar: (root, { link }, { models, token, user }) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!link) {
        throwBadRequest();
      }

      return setAvatar(link, user.id, models);
    },

    setPublicKeys: (
      root,
      { IdPubKey, SpPubKey, SignaturePubKey, Signature, EphPubKey },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (
        !IdPubKey ||
        !SpPubKey ||
        !Signature ||
        !SignaturePubKey ||
        !EphPubKey
      ) {
        throwBadRequest();
      }

      return setPublicKeys(
        IdPubKey,
        SpPubKey,
        SignaturePubKey,
        Signature,
        EphPubKey,
        models,
        user
      );
    },
    checkPublicKeys: (
      root,
      { hashedIdPubKey, hashedSpPubKey },
      { models, token, user }
    ) => {
      if (!user || !token) {
        throwUnauthenicated();
        return;
      }

      if (!hashedIdPubKey || !hashedSpPubKey) {
        throwBadRequest();
        return;
      }

      return checkPublicKeys(hashedIdPubKey, hashedSpPubKey, models, user);
    },
  },
};
