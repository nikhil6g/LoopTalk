import { AddIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupCreationModal from "./miscellaneous/GroupCreationModal";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  Box,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { motion } from "framer-motion"; // for animation
import dayjs from "dayjs"; // for formatting the time
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const toast = useToast();

  const getRandomGroupImage = () => {
    const groupImages = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQgH7hfzVMVgqIFuiLS-pM3fijMZfLWK5Lrg&s",
      "https://media.istockphoto.com/id/1078838084/vector/five-sitting-business-executives-people-in-a-meeting-logo.jpg?s=612x612&w=0&k=20&c=RXHl2sJSx9HzzB0g5ruvonu_pBQx8gaDMOZWRN8b3L0=",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoEIrNMCipxZtPKTwB24xMN28c6YtiuBeK3g&s",
    ];
    return groupImages[Math.floor(Math.random() * groupImages.length)];
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/chat`,
        {
          method: "GET", // HTTP method
          headers: {
            Authorization: `Bearer ${user.token}`, // Include token in the header
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json(); // Parse JSON data
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: `Failed to Load the chats,${error}`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={4}
      bg="linear-gradient(to-r, teal.400, purple.500)"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      boxShadow="xl"
      transition="all 0.3s ease"
      _hover={{ boxShadow: "2xl", transform: "scale(1.03)" }}
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        fontWeight="bold"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        color="white"
      >
        My Chats
        <Menu>
          <MenuButton
            as={Button}
            bg="white"
            color="teal.600"
            _hover={{ bg: "teal.500", color: "white" }}
            borderRadius="lg"
            boxShadow="sm"
            transition="all 0.2s ease"
            _focus={{ boxShadow: "outline" }} // Remove outline on focus
            _active={{ transform: "scale(0.98)" }} // Slightly shrink when active
          >
            <AddIcon />
          </MenuButton>
          <MenuList
            bg="white"
            border="1px solid #ddd"
            borderRadius="md"
            boxShadow="lg"
            mt={1}
            w="200px"
            _hover={{ boxShadow: "xl" }}
          >
            <MenuItem
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              _hover={{ bg: "teal.50", color: "teal.600" }}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight="semibold"
              transition="all 0.2s ease"
            >
              <GroupCreationModal>
                <Button
                  leftIcon={<AddIcon />}
                  fontSize={{ base: "17px", md: "14px" }}
                  bg="teal.600"
                  color="white"
                  _hover={{ bg: "teal.500" }}
                  w="100%"
                  borderRadius="md"
                  boxShadow="sm"
                  transition="all 0.3s ease"
                >
                  New Group Chat
                </Button>
              </GroupCreationModal>
            </MenuItem>
            <MenuItem
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              _hover={{ bg: "teal.50", color: "teal.600" }}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight="semibold"
              transition="all 0.2s ease"
            >
              <GroupCreationModal isBroadcast={true}>
                <Button
                  leftIcon={<AddIcon />}
                  fontSize={{ base: "17px", md: "14px" }}
                  bg="teal.600"
                  color="white"
                  _hover={{ bg: "teal.500" }}
                  w="100%"
                  borderRadius="md"
                  boxShadow="sm"
                  transition="all 0.3s ease"
                >
                  New Broadcast List
                </Button>
              </GroupCreationModal>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="auto"
        boxShadow="sm"
        border="1px solid #ddd"
        borderColor="teal.200"
      >
        {chats ? (
          <Stack overflowY="auto">
            {chats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                  color={selectedChat === chat ? "white" : "black"}
                  px={4}
                  py={3}
                  borderRadius="lg"
                  _hover={{
                    bg: selectedChat === chat ? "#38B2AC" : "#D3D3D3",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  transition="all 0.3s ease"
                >
                  <Box display="flex" alignItems="center">
                    {/* Profile Image */}
                    <Image
                      src={
                        !chat.isGroupChat
                          ? !chat.latestMessage
                            ? "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                            : getSender(loggedUser, chat.users).pic
                          : chat.isBroadcast
                          ? "/broadcastIcon.png" // Use a custom broadcast image
                          : getRandomGroupImage() // Random group image for group chats
                      }
                      alt="Profile"
                      boxSize="40px"
                      borderRadius="full"
                      mr={3}
                      objectFit="cover"
                    />
                    <Box flex="1">
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        color={selectedChat === chat ? "white" : "teal.600"}
                      >
                        {!chat.isGroupChat
                          ? getSender(loggedUser, chat.users).name
                          : !chat.isBroadcast
                          ? chat.chatName
                          : `Broadcast: ${chat.chatName}`}
                      </Text>
                      {chat.latestMessage && (
                        <Text
                          fontSize="xs"
                          mt={1}
                          color={
                            selectedChat === chat ? "teal.100" : "gray.600"
                          }
                        >
                          <b>{chat.latestMessage.sender.name} : </b>
                          {chat.latestMessage.content.length > 50
                            ? chat.latestMessage.content.substring(0, 51) +
                              "..."
                            : chat.latestMessage.content}
                        </Text>
                      )}
                    </Box>
                    {/* Message Time */}
                    <Text
                      fontSize="xs"
                      color={selectedChat === chat ? "teal.100" : "gray.500"}
                      textAlign="right"
                    >
                      {chat.latestMessage
                        ? dayjs(chat.latestMessage.createdAt).fromNow() // Using day.js for time formatting
                        : "No messages"}
                    </Text>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
