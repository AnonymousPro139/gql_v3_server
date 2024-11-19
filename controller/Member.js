// GraphQL
export const createMember = async (
  groupId,
  userId,
  isAdmin = false,
  transaction,
  models
) => {
  return await models.member.create(
    { groupId, userId, isAdmin },
    { transaction }
  );
};
