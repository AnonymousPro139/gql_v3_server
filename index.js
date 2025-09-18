import dotenv from "dotenv";
// dotenv.config({
//   path: path.join(__dirname, "./config/config.env"),
// });
dotenv.config({ path: "./config/config.env" });
import { ApolloServer } from "@apollo/server";
// import { expressMiddleware } from "@apollo/server/express4"; // legacy
import { expressMiddleware } from "@as-integrations/express5";

import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import requestIP from "request-ip";
import express from "express";
import cookieParser from "cookie-parser";
import http from "http";
import https from "https";
import cors from "cors";
import userRoute from "./routes/User.js";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
// import { useServer } from "graphql-ws/lib/use/ws"; // legacy
import { useServer } from "graphql-ws/use/ws";

import { errorHandler } from "./middlewares/errorHandler.js";
import db from "./config/db_mysql.js";
import db_mongo from "./config/db_mongo.js";
import { verifyJWT } from "./utils/jwt.js";
import { getDynamicContext } from "./utils/functions.js";
import { throwInvalidToken } from "./utils/Error.js";
import resolvers from "./graphql/resolvers/index.js";
import typeDefs from "./graphql/typedefs/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { checkToken, file_protect } from "./middlewares/file_protect.js";
import fs from "fs";

const app = express();

// SSL config
const options = {
  key: fs.readFileSync("./172.16.12.206-key.pem"),
  cert: fs.readFileSync("./172.16.12.206.pem"),
};

const httpsServer = https.createServer(options, app);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://172.16.12.94:3000",
      "https://172.16.12.94:3000",
      "https://172.16.12.23:3000",

      "https://172.16.12.75:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://172.16.12.21:3000",
      "http://172.16.12.205:3000",
      "http://172.16.12.206:3000",
      "https://172.16.12.206:3000",

      "http://172.16.12.207:5173",
      "http://localhost:5173",
      "https://gql-v2-client.vercel.app/",
    ],
  })
);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET
app.use("/public", checkToken, express.static(path.join(__dirname, "public")));
// GET
app.use(
  "/uploads",
  checkToken,
  file_protect,
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api", userRoute);

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpsServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/graphql",
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer(
  {
    schema,
    context: (ctx, msg, args) => {
      // This will be run every time the client sends a subscription request
      // wsServer.close()
      return getDynamicContext(ctx, msg, args);
    },

    onConnect: async (ctx) => {
      console.log("onConnect -----------------");
      if (
        ctx.connectionParams?.accessToken === undefined ||
        !ctx.connectionParams.accessToken
      ) {
        if (
          ctx.connectionParams?.Authorization === undefined ||
          !ctx.connectionParams.Authorization
        ) {
          console.log("terminate the socket");
          return false;
        } else {
          return true;
        }
      }

      // Check authentication every time a client connects.
      // if (tokenIsNotValid(ctx.connectionParams)) {
      //   // You can return false to close the connection  or throw an explicit error
      //   throw new Error('Auth token missing!');
      // }

      // throw new Error('Auth token missing!');
    },
    onDisconnect: (webSocket, context) => {
      console.log("websocket disconnected -------------");
    },
  },
  wsServer
);

const apolloServer = new ApolloServer({
  schema,
  csrfPrevention: true, // Using graphql-upload without CSRF prevention is very insecure.
  uploads: false,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer: httpsServer }), // HTTP server-ийг зөв shutdown хийх код
    //WebSocket server-ийг зөв shutdown хийх код
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  formatError: (formattedError, error) => {
    console.log("barilaaaa", error);
    // Return a different error message
    // if (
    //   formattedError.extensions.code ===
    //   ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
    // ) {
    //   return {
    //     ...formattedError,
    //     message: "Your query doesn't match the schema. Try double-checking it!",
    //   };
    // }

    // Otherwise return the formatted error. This error can also
    // be manipulated in other ways, as long as it's returned.
    return formattedError;
  },
});

app.use(
  graphqlUploadExpress({
    // maxFileSize: 1000000,
    maxFiles: 4,
  })
);

apolloServer.start().then(() => {
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: ({ req }) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(" ")[0] === "Bearer"
        ) {
          try {
            const data = verifyJWT(req.headers.authorization.split(" ")[1]);

            return {
              user: data,
              models: db,
              token: req.headers.authorization.split(" ")[1],
              ip: requestIP.getClientIp(req),
            };
          } catch (e) {
            throwInvalidToken();
          }
        } else if (req.query && req.query.token) {
          try {
            const data = verifyJWT(req.query.token);

            return {
              user: data,
              models: db,
              token: req.query.token,
              ip: requestIP.getClientIp(req),
            };
          } catch (e) {
            throwInvalidToken();
          }
        }
        return {
          user: null,
          models: db,
          token: null,
          ip: requestIP.getClientIp(req),
        };
      },
    })
  );
});

app.use(errorHandler); // Anhaar!!! apollo n ooroo bidnii throw hiisen error-g ywuulad bga

// db_mongo();

db.sequelize
  .sync()
  .then(() => {
    console.log("DB sync hiigdlee...");
  })
  .catch((err) => console.log(err));

db.user.hasMany(db.message);
db.message.belongsTo(db.user);

db.channel.hasMany(db.message);
db.message.belongsTo(db.channel);

// db.channel.belongsTo(db.group);
db.group.belongsTo(db.channel);

db.group.belongsToMany(db.user, {
  through: db.member,
});

db.user.belongsToMany(db.group, {
  through: db.member,
});

db.friend.belongsTo(db.user, {
  as: "friends",
  foreignKey: "userId",
});
db.friend.belongsTo(db.user, {
  as: "userFriends",
  foreignKey: "friendId",
  through: db.friend,
});

db.user.belongsToMany(db.message, {
  through: db.message_seen,
});
db.message.belongsToMany(db.user, {
  through: db.message_seen,
});

db.user.hasOne(db.avatar);
db.avatar.belongsTo(db.user);

db.message.hasMany(db.message_seen);
db.message_seen.belongsTo(db.message);

db.user.hasMany(db.message_seen);
db.message_seen.belongsTo(db.user);

db.channel.hasMany(db.message_seen);
db.message_seen.belongsTo(db.channel);

db.message.hasMany(db.message_reaction);
db.message_reaction.belongsTo(db.message);

// db.user.hasMany(db.message_reaction)
db.message_reaction.belongsTo(db.user);

db.user.hasMany(db.log);
db.log.belongsTo(db.user);

db.notification.belongsTo(db.user, {
  as: "target",
  foreignKey: "userId",
  through: db.notification,
});
db.notification.belongsTo(db.user, {
  as: "my",
  foreignKey: "myId",
  through: db.notification,
});

// v3 дээр нэмэв

// ялгаатай төхөөрөмжүүд ялгаатай түлхүүрүүдтэй байна
db.user.hasMany(db.key);
db.key.belongsTo(db.user);

db.user.hasMany(db.ephkey);
db.ephkey.belongsTo(db.user);

db.ephkey.hasMany(db.message);
db.message.belongsTo(db.ephkey);

// v4 дээр нэмэв
db.user.hasOne(db.push_notification);
db.push_notification.belongsTo(db.user);

httpsServer.listen(process.env.PORT, () =>
  console.log(
    `[vers-4] Server listening on port ${process.env.PORT}, db: ${process.env.SEQUELIZE_DATABASE}`
  )
);
