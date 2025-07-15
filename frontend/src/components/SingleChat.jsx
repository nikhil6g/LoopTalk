import "./styles.css";
import {
  IconButton,
  Spinner,
  useToast,
  Box,
  Text,
  Input,
  FormControl,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowBackIcon,
  AttachmentIcon,
  ArrowRightIcon,
} from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "lottie-react";
import animationData from "../animations/typing.json";

import GroupProfileModal from "./miscellaneous/GroupProfileModal";
import { ChatState } from "../Context/ChatProvider";
import { useRef } from "react";
import { uploadToCloudinary } from "../config/actions";

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const lastRoomRef = useRef(null);
  const switchTimeoutRef = useRef();
  const selectedChatCompareRef = useRef();
  const fileInputRef = useRef(null);

  const toast = useToast();

  const {
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
    socket,
    socketConnected,
  } = ChatState();

  //debouncing
  const switchChat = (newRoomId) => {
    clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      if (lastRoomRef.current) {
        socket.emit("leave chat", lastRoomRef.current);
      }
      socket.emit("join chat", newRoomId);
      lastRoomRef.current = newRoomId;
    }, 300);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/message/${
          selectedChat._id
        }`,
        config
      );
      setMessages(data);
      setLoading(false);

      switchChat(selectedChat._id);
    } catch (error) {
      if (error.response.status === 403) {
        toast({
          title: "Error Occured!",
          description: "Failed to Load the Messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const sendMessage = async (event) => {
    if (!newMessage && !attachedFile) return;

    socket.emit("stop typing", selectedChat._id);

    let mediaUrl = null;
    let mediaType = null;

    if (attachedFile) {
      try {
        const { url, resource_type } = await uploadToCloudinary(attachedFile);
        mediaUrl = url;
        mediaType = resource_type;
        console.log(`url is ${url} \n media type is ${mediaType}`);
      } catch (error) {
        toast({
          title: "Upload failed!",
          description: error.message || "Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }
    }
    const message = {
      content: newMessage,
      chatId: selectedChat._id,
      senderId: user._id,
      mediaUrl,
      mediaType,
    };
    setNewMessage("");
    setAttachedFile(null);

    socket.emit("New message", message);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    socket.on("Message sended", (message) => {
      console.log(message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompareRef.current || // if chat is not selected or doesn't match current chat
        selectedChatCompareRef.current._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
      }
    });

    socket.on("Error", (errorData) => {
      if (errorData.message.startsWith("You have blocked")) {
        toast({
          title: "Error Occurred!",
          description: `${errorData.message} Unblock first to resume communication.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } else if (errorData.message.includes("blocked you")) {
        toast({
          title: "Error Occurred!",
          description: `${errorData.message} You cannot send messages.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error Occurred",
          description:
            errorData.message || "Failed to send message. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    });

    return () => {
      socket.off("typing");
      socket.off("stop typing");
      socket.off("Message sended");
      socket.off("message recieved");
      socket.off("Error");
    };
  }, [socket]);

  useEffect(() => {
    fetchMessages();

    selectedChatCompareRef.current = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users).name}
                  <ProfileModal
                    targetUser={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName}
                  <GroupProfileModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
                    style={{
                      marginBottom: 15,
                      marginLeft: 0,
                      width: 70,
                    }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Box display="flex" alignItems="center">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <IconButton
                  icon={<AttachmentIcon />}
                  aria-label="Attach"
                  size="lg"
                  colorScheme="teal"
                  mr={2}
                  onClick={() => fileInputRef.current.click()}
                />
                <Input
                  variant="filled"
                  bg="white"
                  placeholder="Send a message... ✍️"
                  value={newMessage}
                  onChange={typingHandler}
                  _placeholder={{ color: "gray.500", fontStyle: "italic" }}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.300"
                  focusBorderColor="teal.400"
                  p={4}
                  flex="1"
                />
                <IconButton
                  icon={<ArrowRightIcon />}
                  aria-label="Send"
                  size="lg"
                  colorScheme="teal"
                  ml={2}
                  onClick={sendMessage}
                />
              </Box>
              {attachedFile && (
                <Text fontSize="sm" color="gray.600" mt={1} ml={2}>
                  📎 Attached: {attachedFile.name}
                </Text>
              )}
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Box textAlign="center">
            <Text
              fontSize="3xl"
              pb={3}
              fontFamily="'Poppins', sans-serif"
              fontWeight="bold"
              color="teal.500"
            >
              Start a Conversation! 🌟
            </Text>
            <Text fontSize="md" color="gray.500">
              Tap on a user to begin chatting.
            </Text>
          </Box>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
