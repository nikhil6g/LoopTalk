//Used to make HTTP requests to the backend.
import axios from "axios";

//A React Hook is a special function(start with 'use') in React that lets developers use state and other React features without writing a class.
// It makes code simpler and easier to manage by allowing functionality to be added directly within components.
// React Hooks makes the code easier to read and write.
import { useState } from "react";
import {
  useToast,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

//The Login function is a React functional component that returns a JSX representation of a login form.
// This JSX is eventually rendered as HTML by React.
const Login = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const toast = useToast();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = ChatState();

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/user/login`,
        { email, password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setUser(data);
      localStorage.setItem("userInfo", JSON.stringify(data));

      setLoading(false);
      navigate("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  return (
    //VStack -- vertical stack functionality like column widget
    <VStack spacing={5} align="stretch" mt={5}>
      <FormControl id="email" isRequired>
        <FormLabel fontWeight="bold" color="teal.600">
          Email Address
        </FormLabel>
        <Input
          value={email}
          type="email"
          placeholder="Enter Your Email Address"
          onChange={(e) => setEmail(e.target.value)}
          focusBorderColor="teal.500"
          borderColor="gray.300"
          _hover={{ borderColor: "teal.400" }}
          borderRadius="md"
          bg="gray.50"
          size="md"
        />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel fontWeight="bold" color="teal.600">
          Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Enter Password"
            focusBorderColor="teal.500"
            borderColor="gray.300"
            _hover={{ borderColor: "teal.400" }}
            borderRadius="md"
            bg="gray.50"
            size="md"
          />
          <InputRightElement width="4rem">
            <Button
              h="1.5rem"
              size="sm"
              color="teal.600"
              variant="ghost"
              _hover={{ bg: "teal.100", color: "teal.800" }}
              onClick={handleClick}
            >
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="teal"
        width="100%"
        mt={4}
        size="md"
        borderRadius="md"
        boxShadow="lg"
        _hover={{ transform: "scale(1.03)", bg: "teal.600" }}
        onClick={submitHandler}
        isLoading={loading}
      >
        Login
      </Button>

      <Button
        variant="solid"
        colorScheme="red"
        width="100%"
        size="md"
        mt={2}
        borderRadius="md"
        _hover={{ bg: "red.600" }}
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
      >
        Get Guest User Credentials
      </Button>
      <Text
        textAlign="center"
        fontSize="sm"
        mt={2}
        color="teal.500"
        cursor="pointer"
        _hover={{ textDecoration: "underline" }}
      >
        <Link to="/reset-password">Forgot Password?</Link>
      </Text>
    </VStack>
  );
};

export default Login;
