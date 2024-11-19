// GraphQL
export const createChannel = async (name, dm = false, transaction, models) => {
  return await models.channel.create({ name: name, dm: dm }, { transaction });
};
