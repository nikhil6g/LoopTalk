function formatChat(chatDoc, userId) {
  const chat = chatDoc._doc ? { ...chatDoc._doc } : { ...chatDoc };

  const myKeyObj = chat.encryptedAESKeys.find(
    (key) => key.user.toString() === userId.toString()
  );
  chat.myAESKey = myKeyObj ? myKeyObj.encryptedAESKey : null;
  delete chat.encryptedAESKeys;

  return chat;
}

module.exports = formatChat;
