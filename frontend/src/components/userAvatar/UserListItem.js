import { Avatar } from "@chakra-ui/avatar";
import { Box, Text, Flex } from "@chakra-ui/layout";
//import { ChatState } from "../../Context/ChatProvider";

const UserListItem = ({ user, handleFunction }) => {
  //const { user } = ChatState();

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="white"
      _hover={{
        background: "#EDF2F7", // Light grayish background on hover
        transform: "scale(1.02)", // Slight zoom-in effect
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Shadow effect on hover
      }}
      transition="all 0.2s ease-in-out"
      w="100%"
      display="flex"
      alignItems="center"
      color="black"
      px={4}
      py={3}
      mb={3}
      borderRadius="md"
      boxShadow="sm"
    >
      <Avatar
        size="md"
        cursor="pointer"
        name={user.name}
        src={user.pic}
        mr={4} // Space between avatar and text
        border="2px solid #38B2AC" // Add a border to highlight the avatar
      />
      <Flex flexDirection="column">
        <Text fontWeight="bold" fontSize="md" color="#2D3748">
          {user.name}
        </Text>
        <Text fontSize="sm" color="gray.600">
          <b>Email:</b> {user.email}
        </Text>
      </Flex>
    </Box>
  );
};

export default UserListItem;
