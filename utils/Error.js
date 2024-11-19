import { GraphQLError } from "graphql";

export const throwUnauthenicated = () => {
  throw new GraphQLError("Логин хийгээгүй байна.", {
    extensions: { code: "UNAUTHENTICATED" },
  });
};

export const throwInvalidToken = () => {
  throw new GraphQLError("Буруу токен", {
    extensions: { code: "INVALIDTOKEN" },
  });
};

export const throwBadRequest = (cause = "Дутуу утга дамжуулсан") => {
  throw new GraphQLError(cause, {
    extensions: { code: "BAD_REQUEST" },
  });
};
