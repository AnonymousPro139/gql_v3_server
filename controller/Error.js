// GraphQL
export const createError = async (err, userId, models) => {
  return await models.error.create({
    name: err.message,
    file: err.fileName,
    user_id: userId,
  });
};
