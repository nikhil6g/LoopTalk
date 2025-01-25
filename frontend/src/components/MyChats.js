import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupCreationModal from "./miscellaneous/GroupCreationModal";
import { Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const toast = useToast();

  const fetchChats = async () => {
    // console.log(user._id);
    try {
      const response = await fetch("/api/chat", {
        method: "GET", // HTTP method
        headers: {
          Authorization: `Bearer ${user.token}`, // Include token in the header
        },
      });

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
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
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
        d="flex"
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
              d="flex"
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
              d="flex"
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
        d="flex"
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
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                color={selectedChat === chat ? "white" : "black"}
                px={4}
                py={3}
                borderRadius="lg"
                key={chat._id}
                _hover={{
                  bg: selectedChat === chat ? "#38B2AC" : "#D3D3D3",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
                transition="all 0.3s ease"
              >
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={selectedChat === chat ? "white" : "teal.600"}
                >
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : !chat.isBroadcast
                    ? chat.chatName
                    : `Broadcast: ${chat.chatName}`}
                </Text>
                {chat.latestMessage && (
                  <Text
                    fontSize="xs"
                    mt={1}
                    color={selectedChat === chat ? "teal.100" : "gray.600"}
                  >
                    <b>{chat.latestMessage.sender.name} : </b>
                    {chat.latestMessage.content.length > 50
                      ? chat.latestMessage.content.substring(0, 51) + "..."
                      : chat.latestMessage.content}
                  </Text>
                )}
              </Box>
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
