import {
  throwInvalidToken,
  throwUnauthenicated,
  throwBadRequest,
} from "./Error.js";
import { verifyJWT } from "./jwt.js";

export const getDynamicContext = ({ connectionParams }, msg, args) => {
  // var connectionParams = ctx.connectionParams;
  if (
    connectionParams?.Authorization &&
    connectionParams?.Authorization.split(" ")[0] === "Bearer"
  ) {
    try {
      const data = verifyJWT(connectionParams.Authorization.split(" ")[1]);

      return { user: data };
    } catch (e) {
      throwInvalidToken();
    }
  } else {
    if (connectionParams && connectionParams.authToken) {
      try {
        const data = verifyJWT(connectionParams.authToken);

        return { user: data };
      } catch (e) {
        throwInvalidToken();
      }
    } else {
      if (connectionParams && connectionParams.accessToken) {
        try {
          const data = verifyJWT(connectionParams.accessToken);

          return { user: data };
        } catch (e) {
          throwInvalidToken();
        }
      }
    }
  }

  return { user: null };
};

export const isAdmin = async (user, models) => {
  if (user.role !== "admin") {
    throwBadRequest("Таны эрх хүрэхгүй!");
    // return;
  }

  // Үнэхээр админ эсэх
  var check = await models.user.findOne({
    where: { id: user.id, role: "admin" },
  });

  if (!check) {
    throwBadRequest("Таны эрх хүрэхгүй");
    // return;
  }
};
