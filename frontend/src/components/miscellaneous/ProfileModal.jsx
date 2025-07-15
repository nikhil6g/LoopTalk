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
  VStack,
  Box,
  useToast,
  VisuallyHidden,
  Input,
  Progress,
  CircularProgress,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../../config/actions";
import { ChatState } from "../../Context/ChatProvider";

const ProfileModal = ({ targetUser, children }) => {
  const { user: loggedUser, setUser } = ChatState();

  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const navigate = useNavigate();
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
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };
      //console.log(`Bearer ${loggedUser.token}`);
      const userId = targetUser._id;

      await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/user/block`,
        { userId },
        config
      );

      toast({
        title: isBlocked ? "User Unblocked" : "User Blocked",
        description: isBlocked
          ? `You have unblocked ${targetUser.name}.`
          : `You have blocked ${targetUser.name}.`,
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
          ? `Failed to unblock ${targetUser.name}.`
          : `Failed to block ${targetUser.name}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
    setLoading(false);
  };

  const initialBlockCheck = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };

      const { data } = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/api/user/check-block-status?userId=${targetUser._id}`,
        config
      );

      setIsBlocked(data.isBlocked);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (loggedUser._id !== targetUser._id) {
      initialBlockCheck();
    }
  }, [loggedUser._id, targetUser._id]);

  const onChangeUsername = async () => {
    if (!newUsername || newUsername === loggedUser.name) {
      toast({
        title: "Invalid Username",
        description: "Please enter a new valid username.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };

      await axios.put(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/user/change-username`,
        { newUsername },
        config
      );

      const updated = { ...loggedUser, name: newUsername };
      setUser(updated);
      localStorage.setItem("userInfo", JSON.stringify(updated));
    } catch (error) {
      toast({
        title: "Failed to update username",
        description:
          error.response?.data?.message ||
          error.message ||
          "please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setNewUsername("");
      setEditMode(false);
    }
  };

  const onUpdateProfilePic = async (pics) => {
    if (!pics) return;

    try {
      setIsUploading(true);
      setUploadProgress(10); // Initial progress

      // 1. Upload to Cloudinary
      const { url, resource_type } = await uploadToCloudinary(
        pics,
        "loop-talk-images",
        setUploadProgress,
        10
      );
      setUploadProgress(60); // Cloudinary upload complete

      console.log(url);
      // 2. Update backend
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      };
      await axios.put(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/user/update-profile`,
        { pic: url.toString() },
        config
      );

      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Show completion briefly

      const updatedUser = { ...loggedUser, pic: url };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      toast({
        title: "⚠️ Upload Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          display={{ base: "flex" }}
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
            display="flex"
            justifyContent="center"
            color="white"
          >
            {targetUser.name}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody
            display="flex"
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
                  src={targetUser.pic}
                  alt={targetUser.name}
                  boxShadow="xl"
                  _hover={{
                    transform: "scale(1.1)",
                    transition: "all 0.3s ease-in-out",
                  }}
                />
                {loggedUser._id === targetUser._id && (
                  <>
                    <VisuallyHidden>
                      <Input
                        id="profile-pic-upload"
                        type="file"
                        p={1.5}
                        accept="image/*"
                        onChange={(e) => onUpdateProfilePic(e.target.files[0])}
                      />
                    </VisuallyHidden>
                    <Box
                      className="profile-icon"
                      position="absolute"
                      bottom="10px"
                      right="10px"
                      bg="white"
                      borderRadius="full"
                      p={2}
                      boxShadow="lg"
                      cursor={isUploading ? "not-allowed" : "pointer"}
                      _hover={
                        !isUploading ? { bg: "teal.500", color: "white" } : {}
                      }
                      transition="all 0.3s"
                      opacity={isUploading ? 1 : 0}
                    >
                      {isUploading ? (
                        <CircularProgress
                          isIndeterminate={uploadProgress === 0}
                          value={uploadProgress}
                          color="teal.600"
                          size="32px"
                          thickness="12px"
                        />
                      ) : (
                        <label
                          htmlFor="profile-pic-upload"
                          style={{ cursor: "inherit" }}
                        >
                          <Icon
                            viewBox="0 0 24 24"
                            boxSize={6}
                            color="teal.600"
                          >
                            <path
                              fill="currentColor"
                              d="M12 5.5C8.963 5.5 6.5 7.963 6.5 11S8.963 16.5 12 16.5 17.5 14.037 17.5 11 15.037 5.5 12 5.5zM12 4c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7 3.134-7 7-7zM22 7H19.334L18.102 5H5.898L4.666 7H2V19H22V7z"
                            />
                          </Icon>
                        </label>
                      )}
                    </Box>
                  </>
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
              Email: {targetUser.email}
            </Text>

            {loggedUser._id === targetUser._id && (
              <VStack spacing={4} mt={4} w="full">
                {editMode ? (
                  <>
                    <Input
                      placeholder="Enter new username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      _placeholder={{ color: "white" }}
                      color="white"
                      bg="teal.700"
                      _focus={{
                        borderColor: "white",
                        boxShadow: "0 0 0 1px white",
                      }}
                    />
                    <Box display="flex" justifyContent="center" gap={4} mt={2}>
                      <Button colorScheme="teal" onClick={onChangeUsername}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        color="white"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditMode(true)}
                    colorScheme="teal"
                    w="full"
                  >
                    Change Username
                  </Button>
                )}

                {/* Reset Password */}
                <Button
                  bg="red.500"
                  color="white"
                  _hover={{ bg: "red.400" }}
                  w="full"
                  fontWeight="bold"
                  onClick={() => {
                    navigate("/reset-password");
                  }}
                >
                  Reset Password
                </Button>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter display="flex" justifyContent="space-between">
            {loggedUser._id !== targetUser._id &&
            !targetUser.email.endsWith("bot") ? (
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
              {targetUser.name}? This action can be undone later.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBlockClose}>
                Cancel
              </Button>
              <Button
                colorScheme={isBlocked ? "green" : "red"}
                onClick={blockUser}
                ml={3}
                isLoading={loading}
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
