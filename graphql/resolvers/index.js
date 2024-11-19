import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import usersResolvers from "./users.js";
import msgResolvers from "./message.js";
import groupResolvers from "./group.js";
import friendResolvers from "./friend.js";
import fileResolvers from "./uploadFile.js";
import notificationResolvers from "./notification.js";

export default {
  // This maps the `Upload` scalar to the implementation provided
  // by the `graphql-upload` package.
  Upload: GraphQLUpload,

  Query: {
    ...usersResolvers.Query,
    ...msgResolvers.Query,
    ...groupResolvers.Query,
    ...friendResolvers.Query,
    ...notificationResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...msgResolvers.Mutation,
    ...groupResolvers.Mutation,
    ...friendResolvers.Mutation,
    ...fileResolvers.Mutation,
    ...notificationResolvers.Mutation,
  },
  Subscription: {
    ...msgResolvers.Subscription,
    ...friendResolvers.Subscription,
    ...groupResolvers.Subscription,
  },
};
