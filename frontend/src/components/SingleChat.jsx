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

import io from "socket.io-client";
import GroupProfileModal from "./miscellaneous/GroupProfileModal";
import { ChatState } from "../Context/ChatProvider";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

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

      socket.emit("join chat", selectedChat._id);
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
    if (newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/api/message`,
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );
        console.log(data);
        socket.emit("new message", data);
        setMessages([...messages, data[0]]);
      } catch (error) {
        if (error.response.status === 403) {
          //handle blocking related error
          toast({
            title: "Error Occured!",
            description: error.response.data.message.startsWith(
              "You have blocked"
            )
              ? `${error.response.data.message} Unblock first to resume communication.`
              : `${error.response.data.message} You cannot send messages.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        } else {
          //handle general error
          toast({
            title: "Error Occurred",
            description:
              error.response?.data?.message ||
              "Failed to send messages. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
      }
    }
  };

  useEffect(() => {
    socket = io(import.meta.env.VITE_APP_SOKCET_ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

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
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    loggedUser={user}
                    user={getSenderFull(user, selectedChat.users)}
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
                    animationData={animationData} // directly pass animationData here
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
                <IconButton
                  icon={<AttachmentIcon />}
                  aria-label="Attach"
                  size="lg"
                  colorScheme="teal"
                  mr={2}
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
