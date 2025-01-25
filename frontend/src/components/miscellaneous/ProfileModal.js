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
} from "@chakra-ui/react";
import { useRef } from "react";
import { useToast } from "@chakra-ui/toast";
import { useEffect, useState } from "react";
import axios from "axios";

const ProfileModal = ({ user, children, loggedUser }) => {
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
          boxShadow="lg"
          bgGradient="linear(to-r, teal.400, teal.600)"
        >
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
            <Image
              borderRadius="full"
              boxSize="150px"
              src={user.pic}
              alt={user.name}
              boxShadow="xl"
              mb={4}
            />
            <Text
              fontSize="lg"
              fontFamily="Work sans"
              color="white"
              mb={2}
              textAlign="center"
            >
              Email: {user.email}
            </Text>
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
