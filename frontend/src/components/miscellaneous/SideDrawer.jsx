import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import ChatLoading from "../ChatLoading";
import ProfileModal from "./ProfileModal";
import { getSender } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";
import { ChatState } from "../../Context/ChatProvider";
import {
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Box,
  Text,
  Flex,
  Button,
  useToast,
  useDisclosure,
  Input,
  Avatar,
  Tooltip,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Spinner,
} from "@chakra-ui/react";

function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = ChatState();
  //console.log(user.pic);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/user?search=${search}`,
        config
      );
      //console.log(data);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const accessChat = async (userId) => {
    //console.log(userId);

    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/chat`,
        { userId },
        config
      );

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  return (
    <>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="linear-gradient(90deg, #2b5876 0%, #4e4376 100%)"
        w="100%"
        p="12px 20px"
        borderBottomWidth="3px"
        borderColor="gray.200"
        shadow="lg"
        borderRadius="8px"
      >
        {/* Search Users Button */}
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            onClick={onOpen}
            _hover={{ bg: "#ffffff33" }}
            _focus={{ boxShadow: "none" }}
          >
            <i className="fas fa-search"></i>
            <Text
              d={{ base: "none", md: "flex" }}
              px={4}
              fontWeight="bold"
              color="white"
            >
              Search User
            </Text>
          </Button>
        </Tooltip>

        {/* App Name */}
        <Text
          fontSize="2xl"
          fontFamily="Work sans"
          fontWeight="extrabold"
          color="white"
        >
          LoopTalk
        </Text>

        {/* Notifications and Profile */}
        <Flex alignItems="center" gap={4}>
          {/* Notification Menu */}
          <Menu>
            <MenuButton p={1} position="relative">
              <Popover>
                <PopoverTrigger>
                  <BellIcon fontSize="2xl" m={1} color="white" />
                </PopoverTrigger>
                <PopoverContent bg="teal.600" color="white">
                  <PopoverBody>
                    <Text textAlign="center" p={2}>
                      {notification.length
                        ? `You have ${notification.length} new notifications`
                        : "No new notifications"}
                    </Text>
                    {notification.map((notif) => (
                      <MenuItem key={notif._id} _hover={{ bg: "teal.500" }}>
                        {notif.message}
                      </MenuItem>
                    ))}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              {notification.length > 0 && (
                <Badge
                  position="absolute"
                  top={0}
                  right={0}
                  bg="red.500"
                  color="white"
                  fontSize="0.8em"
                  borderRadius="full"
                  padding="0.2em 0.5em"
                >
                  {notification.length}
                </Badge>
              )}
            </MenuButton>
            <MenuList bg="teal.600" color="white">
              {!notification.length && (
                <Text textAlign="center" p={2}>
                  No New Messages
                </Text>
              )}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                  _hover={{ bg: "teal.500" }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${
                        getSender(user, notif.chat.users).name
                      }`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Profile Menu */}
          <Menu>
            <MenuButton
              as={Button}
              bg="white"
              rightIcon={<ChevronDownIcon />}
              _hover={{ bg: "#f5f5f5" }}
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user} loggedUser={user}>
                <MenuItem fontWeight="medium" _hover={{ bg: "teal.100" }}>
                  My Profile
                </MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem
                fontWeight="medium"
                onClick={logoutHandler}
                _hover={{ bg: "red.100" }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      {/* Search Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader
            borderBottomWidth="1px"
            fontFamily="Work sans"
            bg="teal.500"
            color="white"
            fontWeight="bold"
          >
            Search Users
          </DrawerHeader>
          <DrawerBody bg="gray.50">
            {/* Search Input and Button */}
            <Flex pb={4} gap={2}>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                focusBorderColor="teal.500"
                borderRadius="md"
              />
              <Button
                colorScheme="teal"
                onClick={handleSearch}
                borderRadius="md"
                _hover={{ bg: "teal.600" }}
              >
                Go
              </Button>
            </Flex>

            {/* Search Results */}
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((searchUser) => (
                <UserListItem
                  key={searchUser._id}
                  user={searchUser}
                  handleFunction={() => accessChat(searchUser._id)}
                />
              ))
            )}

            {/* Loading Indicator */}
            {loadingChat && (
              <Spinner ml="auto" display="block" color="teal.500" />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default SideDrawer;
