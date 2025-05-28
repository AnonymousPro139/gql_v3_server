// const { gql } = require("@apollo/server");

export default () => {
  return `
  """ The implementation for this scalar is provided by the GraphQLUpload' export from the 'graphql-upload' package in the resolver map below"""
    scalar Upload

    type Query {
      """ Системийн админ бүх хэрэглэгчийг харах"""
      getUsers: [User!]!

      User(id: String!): User!
      
      """ Тухайн channel-ийн бүх message-г авна"""
      getMessages(channelId: Int!, offset: Int!, limit: Int!): [Message!]!

      getMediaFiles(channelId: Int!, offset: Int!, limit: Int!): [mediaFilesResponse!]!

      """ Өөрийн аватарыг авна"""
      getAvatar: String!

      """ Тухайн channel-ийн хамгийн сүүлийн message-г авна"""
      getLastMessage(channelId: Int!): Message
      
      """ Давхацсан user очиж болно, Шалгах! """
      myFriends: [User!]!
      
      """ Миний найз болох хүсэлт явуулсан, гэвч зөвшөөрөөгүй байгаа users """
      myRequestSentUsers:[User!]!

      """ Надад найз болох хүсэлт илгээсэн, гэвч зөвшөөрөөгүй байгаа users """
      myReceivedRequestsUsers: [User!]!


      """ Өөрийн харилцаж болох группууд (private group ороогүй) """
      getGroups: [Group!]

      """ Админ: Нийт группууд (private group ороогүй) """
      getAllGroups: [Group!]

      """ Өөрийн харилцаж болох private группууд нь user-тэйгээ ирнэ """
      getPrivateGroups: [PrivateGroupResponse!]

      """ Өөрийн харилцаж болох группын бүх гишүүдийг авах """
      getGroupWithMembers(groupId: Int!): getGroupWithMembersResponse!

      """ ADMIN тухайн группын бүх гишүүдийг авах """
      getGroupWithMembersAdmin(groupId: Int!): [User!]!

      """ Name талбараар хайлт хийх"""
      searchBy(value: String!): [User!]!

      myNotifications: [Notification!]

      getPublicKeys(userId: Int!):  UserPublicKeys!

      
    }

    type Mutation {
      deleteUser(id: Int!): User

      createMessage(channelId: Int!, msgKey: String!,  text: String!, isInfo: Boolean!): Boolean!
      createFileMessage(channelId: Int!, text: String!): Boolean!
      seenMessage(channelId: Int!, messageId: Int!): Boolean!
      seenChannelMessages(channelId: Int!, limit: Int!): Boolean!
      unsendMessage(channelId: Int!, messageId: Int!): Boolean!
      reactionMessage(channelId: Int!, messageId: Int!, reaction: String!): Boolean!
      

      createGroup(name: String!): CreateGroupResponse!
      addGroupMember(userId: Int!, groupId: Int!): VoidResponse!

      """ Найзын хүсэлт илгээх """
      createFriendRequest( target_userId: Int!): Boolean!

      """ Найзын хүсэлтэд зөвшөөрвөл хоорондын харилцах групп, channel зэрэг ирнэ, татгалзвал group нь null ирнэ """
      friendRequestResponse(candidate_userId: Int!, isAllow: Boolean!): CreateGroupResponse!

      """ Хэрэглэгч өөрийн аватарыг хадгалах """
      setAvatar(link:String!): String!

      
      unFriend( friendId: Int!, groupId: Int!, channelId: Int!): Boolean!
      removeUserFromGroup( userId: Int!, groupId: Int!, groupName: String!, channelId: Int! ): Boolean!
      leftGroup( groupId: Int!, groupName: String!, channelId: Int! ): Boolean!
      
      
      """ Файл илгээх """
      singleUpload( file: Upload!): File!
      multipleUpload(files: [Upload]!, channelId: Int!): FileResponse!

      """ save to Public keys """
      setPublicKeys(IdPubKey: String!, SpPubKey: String!, SignaturePubKey: String!, Signature: String!, EphPubKey: String!): Boolean!
      checkPublicKeys(hashedIdPubKey: String!, hashedSpPubKey: String! ): Boolean!

    """ gql_v4 -  Хэрэглэгч өөрийн push notifation хадгалах """
      setPushToken(pushtoken:String!):  Boolean!

      removePushToken:  Boolean!
    }

    type Subscription {
      """ Өмнөх нь ийм байсан newChannelMessage(channelId: Int!): Message """
      newChannelMessage: Message

      seenMessage: seenMessageResponse!
      unsendMessage: unsendMessageResponse!
      reactionMessage: reactionMessageResponse!
      

      """ Найзуудаас нэг нь шинэ группт намайг нэмсэн бол хэлээрэй """
      addedNewGroup: AddedGroupResponse!

      """ Найзын хүсэлт надад ирвэл хэлээрэй гэж бүртгүүлэх """
      newFriendRequest: User!
      Unfriend: User!
      removeUserFromGroup: removeUserFromGroupResponse!

      """ Миний илгээсэн найзын хүсэлтэнд хэн нэгэн хариулбал хэлээрэй гэж бүртгүүлэх """
      friendRequestResponse: friendRequestResponse!
    }

    type User {
      id: ID!
      lid: String!
      phone: String
      name: String!
      email: String!
      avatar: String
    }

    type UserPublicKeys {
      user: User!
      keys: PublicKeys!
      ephkey: EphKey!
    }

    type PublicKeys {
      id:  ID!
      IdPubKey: String!
      SpPubKey: String!
      SignaturePubKey: String!
      Signature: String!
    }
    
    type EphKey {
      id: ID!
      userId: Int!
      ephkey: String!
    }
    type Notification {
      id: ID!
      info: String
      type: String!
      target: User!
      my: User!
      createdAt:String!
    }
    type File {
      filename: String!
      mimetype: String!
      encoding: String!
    }

    type FileResponse {
      success: Boolean!
      file: [File]
    }

    type AddedGroupResponse {
      group: Group!
      host: User!
      addedUser: User!
    }

    type getGroupWithMembersResponse {
      users: [User!]!
      adminId: [Int!]!
    }
    type removeUserFromGroupResponse {
      group: Group!
      removedUserId:ID!
    }

    type UserWithToken {
      id: ID!
      name: String!
      email: String!
      token: String
    }

    type Message {
      id: Int!
      userId: Int!
      text: String!
      msgKey: String
      channelId: Int!
      createdAt:String!
      dm: Boolean!
      isFile: Boolean!
      isInfo: Boolean!
      fileViewToken: String
      isView: Boolean!
      isDeleted: Boolean!
      name: String
      avatar: String
      seen: [User!]
      reaction: [reactionMessage!]
    }

    type mediaFilesResponse {
      id: Int!
      userId: Int!
      text: String!
      channelId: Int!
      createdAt:String!
      dm: Boolean!
      isFile: Boolean!
      fileViewToken: String
      isView: Boolean!
      isDeleted: Boolean!
      name: String
      avatar: String
    }

    type reactionMessage {
      reaction: String!
      user: User!
    }

    type seenMessageResponse {
      id: Int!
      msgId: Int!
      user: User!
      channelId: Int!
      seen: Boolean!
    }

    type unsendMessageResponse {
      msgId: Int!
      user: User!
      channelId: Int!
    }

    type reactionMessageResponse {
      id: Int!
      msgId: Int!
      user: User!
      channelId: Int!
      reaction: String!
    }


    type CreateGroupResponse {
      success: Boolean!
      group: Group
      channel: Channel
      errors: [Error!]
    }

    type Group {
      id: Int!
      name: String!
      createdAt: String!
      channelId: Int!
    } 

    type PrivateGroupResponse {
      group: Group!,
      user: User!
      keys: PublicKeys!
      ephkey: EphKey!
      
    }

    type PushToken {
      id: Int!
      pushtoken: String!
      status: String!
      createdAt: String!
    }

    type Channel {
      id: Int!
      name: String!
      messages: [Message!]
      users: [User!]
      dm: Boolean!
    }

    type Error {
      path: String!
      message: String
    }

    type VoidResponse {
      success: Boolean!
      errors: [Error!]
    }

    type friendRequestResponse {
      isAllow: Boolean!
      from: User!
      group: Group
      keys: PublicKeys
      ephkey: EphKey
    }
  `;
};
