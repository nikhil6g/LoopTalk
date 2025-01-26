import { ViewIcon } from "@chakra-ui/icons";
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
  IconButton,
  Text,
  Image,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Icon,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useToast } from "@chakra-ui/toast";
import { useEffect, useState } from "react";
import axios from "axios";
import { VStack, Box } from "@chakra-ui/layout";
import { useHistory } from "react-router-dom";

const ProfileModal = ({ user, children, loggedUser }) => {
  const history = useHistory();
  const [isBlocked, setIsBlocked] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isBlockOpen,
    onOpen: onBlockOpen,
    onClose: onBlockClose,
  } = useDisclosure();
  const cancelRef = useRef();

  // Placeholder function for block logic
  const blockUser = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };
      console.log(`Bearer ${loggedUser.token}`);
      const userId = user._id;

      await axios.post("/api/user/block", { userId }, config);

      toast({
        title: isBlocked ? "User Unblocked" : "User Blocked",
        description: isBlocked
          ? `You have unblocked ${user.name}.`
          : `You have blocked ${user.name}.`,
        status: isBlocked ? "info" : "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setIsBlocked(!isBlocked);
      onBlockClose();
      onClose();
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: isBlocked
          ? `Failed to unblock ${user.name}.`
          : `Failed to block ${user.name}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };
  const initialBlockCheck = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/user/check-block-status?userId=${user._id}`,
        config
      );

      setIsBlocked(data.isBlocked);
    } catch (error) {
      console.log(error.message);
    }
  };
  useEffect(() => {
    if (loggedUser._id !== user._id) {
      initialBlockCheck();
    }
  }, [loggedUser._id, user._id]);

  const onChangeUsername = () => {};
  const onUpdateProfilePic = () => {};

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          d={{ base: "flex" }}
          icon={<ViewIcon />}
          onClick={onOpen}
          _hover={{ bg: "teal.600", color: "white" }}
        />
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent
          borderRadius="lg"
          boxShadow="2xl"
          bgGradient="linear(to-r, teal.400, teal.600)"
          position="relative"
          overflow="hidden"
        >
          {/* Enhanced Background */}
          <Box
            position="absolute"
            inset="0"
            bgGradient="radial(teal.500, teal.800)"
            zIndex={-1}
            opacity={0.5}
          />

          <ModalHeader
            fontSize="36px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
            color="white"
            textTransform="uppercase"
          >
            {user.name}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={6}
          >
            {/* Profile Picture with Camera Icon */}
            <Box position="relative" mb={4}>
              <Box
                position="relative"
                _hover={{
                  cursor: "pointer",
                  ".profile-icon": {
                    opacity: 1,
                  },
                }}
              >
                <Image
                  borderRadius="full"
                  boxSize="150px"
                  src={user.pic}
                  alt={user.name}
                  boxShadow="xl"
                  _hover={{
                    transform: "scale(1.1)",
                    transition: "all 0.3s ease-in-out",
                  }}
                />
                {loggedUser._id === user._id && (
                  <Box
                    className="profile-icon"
                    position="absolute"
                    bottom="10px"
                    right="10px"
                    bg="white"
                    borderRadius="full"
                    p={2}
                    boxShadow="lg"
                    cursor="pointer"
                    onClick={onUpdateProfilePic}
                    _hover={{ bg: "teal.500", color: "white" }}
                    transition="all 0.3s"
                    opacity={0}
                  >
                    <Icon viewBox="0 0 24 24" boxSize={6} color="teal.600">
                      <path
                        fill="currentColor"
                        d="M12 5.5C8.963 5.5 6.5 7.963 6.5 11S8.963 16.5 12 16.5 17.5 14.037 17.5 11 15.037 5.5 12 5.5zM12 4c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7 3.134-7 7-7zM22 7H19.334L18.102 5H5.898L4.666 7H2V19H22V7z"
                      />
                    </Icon>
                  </Box>
                )}
              </Box>
            </Box>

            <Text
              fontSize="lg"
              fontFamily="Work sans"
              color="white"
              mb={2}
              textAlign="center"
            >
              Email: {user.email}
            </Text>

            {loggedUser._id === user._id && (
              <VStack spacing={4} mt={6} w="full">
                {/* Change Username */}
                <Button
                  bg="white"
                  color="teal.600"
                  _hover={{ bg: "teal.100" }}
                  w="full"
                  fontWeight="bold"
                  onClick={onChangeUsername}
                >
                  Change Username
                </Button>

                {/* Reset Password */}
                <Button
                  bg="red.500"
                  color="white"
                  _hover={{ bg: "red.400" }}
                  w="full"
                  fontWeight="bold"
                  onClick={() => {
                    history.push("/reset-password");
                  }}
                >
                  Reset Password
                </Button>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter d="flex" justifyContent="space-between">
            {loggedUser._id !== user._id ? (
              <Button
                bg={isBlocked ? "teal.800" : "red.500"}
                color="white"
                _hover={{ bg: isBlocked ? "teal.600" : "red.400" }}
                onClick={onBlockOpen}
                fontWeight="bold"
              >
                {isBlocked ? "Unblock" : "Block"}
              </Button>
            ) : null}
            <Button
              bg="white"
              color="teal.600"
              _hover={{ bg: "teal.100" }}
              onClick={onClose}
              fontWeight="bold"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Block Confirmation Alert */}
      <AlertDialog
        isOpen={isBlockOpen}
        leastDestructiveRef={cancelRef}
        onClose={onBlockClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {isBlocked ? "Unblock User" : "Block User"}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to {isBlocked ? "unblock" : "block"}{" "}
              {user.name}? This action can be undone later.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBlockClose}>
                Cancel
              </Button>
              <Button
                colorScheme={isBlocked ? "green" : "red"}
                onClick={blockUser}
                ml={3}
              >
                {isBlocked ? "Unblock" : "Block"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ProfileModal;
