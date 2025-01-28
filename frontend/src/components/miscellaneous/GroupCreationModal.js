import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../userAvatar/UserBadgeItem";
import UserListItem from "../userAvatar/UserListItem";

const GroupCreationModal = ({ children, isBroadcast = false }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { user, chats, setChats } = ChatState();

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
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
        `${process.env.REACT_APP_API_BASE_URL}/api/user?search=${search}`,
        config
      );
      console.log(data);
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

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || !selectedUsers) {
      toast({
        title: "Please fill all the feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
          isBroadcast: isBroadcast,
        },
        config
      );
      setChats([data, ...chats]);
      onClose();
      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Failed to Create the Chat!",
        description: error.response.data,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal onClose={onClose} isOpen={isOpen} isCentered size="lg">
        <ModalOverlay />
        <ModalContent
          bgGradient="linear(to-r, teal.400, teal.600)"
          borderRadius="lg"
          boxShadow="lg"
        >
          <ModalHeader
            fontSize="36px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
            color="white"
          >
            {isBroadcast ? "Create Broadcast List" : "Create Group Chat"}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={6}
          >
            <FormControl>
              <Input
                placeholder={isBroadcast ? "Broadcast List Name" : "Group Name"}
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                _focus={{ borderColor: "teal.500" }}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users eg: anisul,rohit.."
                mb={3}
                onChange={(e) => handleSearch(e.target.value)}
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                _focus={{ borderColor: "teal.500" }}
              />
            </FormControl>
            <Box w="100%" d="flex" flexWrap="wrap" mb={4}>
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleDelete(u)}
                  _hover={{ bg: "teal.100" }}
                />
              ))}
            </Box>
            {loading ? (
              <div>Loading...</div>
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleGroup(user)}
                    _hover={{ bg: "teal.100" }}
                  />
                ))
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              variant="solid"
              w="full"
              mt={4}
              _hover={{ bg: "teal.700" }}
            >
              {isBroadcast ? "Create Broadcast" : "Create Group"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupCreationModal;
