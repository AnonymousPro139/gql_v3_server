export const NEW_CHANNEL_MESSAGE = "NEW_CHANNEL_MESSAGE";
export const SEEN_MESSAGE = "SEEN_MESSAGE";
export const UNSEND_MESSAGE = "UNSEND_MESSAGE";
export const REACTION_MESSAGE = "REACTION_MESSAGE";
export const NEW_FRIEND_REQUEST = "NEW_FRIEND_REQUEST";
export const FRIEND_REQUEST_RESPONSE = "FRIEND_REQUEST_RESPONSE";
export const ADDED_NEW_GROUP = "ADDED_NEW_GROUP";
export const REMOVE_USER_FROM_GROUP = "REMOVE_USER_FROM_GROUP";

export const UNFRIEND = "UNFRIEND";

export const redisOptions = {
  // host: "redis",
  host: "localhost",
  port: 6379,
};

export const DEBOUNCE_PUSH_NOTIFICATION_TIME = 1 * 60 * 1024; // 1 minute
