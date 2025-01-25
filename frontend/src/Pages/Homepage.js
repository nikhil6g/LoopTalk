import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

function Homepage() {
  const history = useHistory();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) history.push("/chats");
  }, [history]);

  return (
    <Container maxW="xl" centerContent>
      <Box
        d="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        p={3}
        bg="white"
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="lg"
      >
        <Text
          fontSize="4xl"
          fontFamily="'Work sans', sans-serif"
          fontWeight="bold"
          color="teal.500"
          textAlign="center"
        >
          LoopTalk
        </Text>
        <Text fontSize="md" color="gray.600" mt={1}>
          Stay connected with your favorite people
        </Text>
      </Box>
      <Box
        bg="white"
        w="100%"
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="lg"
      >
        <Tabs isFitted variant="enclosed-colored" colorScheme="teal">
          <TabList mb="1em">
            <Tab
              _selected={{ bg: "teal.500", color: "white", fontWeight: "bold" }}
              _hover={{ bg: "teal.100" }}
            >
              Login
            </Tab>
            <Tab
              _selected={{ bg: "teal.500", color: "white", fontWeight: "bold" }}
              _hover={{ bg: "teal.100" }}
            >
              Sign Up
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default Homepage;
