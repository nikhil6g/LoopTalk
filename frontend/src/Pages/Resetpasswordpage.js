import { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  Text,
  HStack,
  useToast,
  Spinner,
  Container,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: New Password
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const toast = useToast();
  const history = useHistory();

  const handleSendOtp = async () => {
    try {
      setIsOtpSent(true);
      const { message } = await axios.post("/api/user/generate-otp", { email });
      console.log(message);
      setTimeout(() => {
        setIsOtpSent(false); // End the loading state
        toast({
          title: "OTP Sent!",
          description: "Check your email for the OTP.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }, 2000); // Simulated 2-second delay
      if (step === 1) setStep(2);
    } catch (err) {
      toast({
        title: "Error Occured!",
        description: err.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      if (
        step === 1 &&
        err.response.data.message.startsWith(
          "OTP is already sent to your email."
        )
      ) {
        setStep(2);
        setIsOtpSent(false);
      }
    }
  };

  const handleResendOtp = () => {
    handleSendOtp();
    setTimeout(() => {
      setIsOtpSent(false);
    }, 2000);
  };

  const handleResetPassword = async () => {
    try {
      const { message } = await axios.post("/api/user/reset-password", {
        email,
        otp,
        newPassword,
      });
      console.log(message);
      toast({
        title: "Password Reset Successful!",
        description: "Now login with new Password.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      history.goBack();
    } catch (err) {
      toast({
        title: "Error Occured!",
        description: err.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <Container maxW="xl" centerContent fluid>
      <Box
        d="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        p={3}
        h="75vh"
        w="100%"
        m="40px 0 15px 0"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            top="50%"
            left="50%"
          >
            <Box
              bg="white"
              p={8}
              rounded="2xl"
              shadow="lg"
              w={{ base: "90%", md: "400px" }}
            >
              <Heading
                textAlign="center"
                fontSize="2xl"
                mb={6}
                bgGradient="linear(to-r, teal.400, blue.500)"
                bgClip="text"
              >
                Reset Password
              </Heading>

              <VStack spacing={5}>
                {step === 1 && (
                  <>
                    <Text>Enter your email:</Text>
                    <Input
                      placeholder="email"
                      size="lg"
                      focusBorderColor="teal.500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      colorScheme="teal"
                      w="full"
                      isDisabled={!email}
                      onClick={handleSendOtp}
                    >
                      {isOtpSent ? <Spinner size="sm" /> : "Send OTP to mail"}
                    </Button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Text>Enter the OTP sent to your email:</Text>
                    <Input
                      placeholder="Enter OTP"
                      size="lg"
                      focusBorderColor="teal.500"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <HStack justifyContent="space-between" w="100%">
                      <Button
                        variant="link"
                        color="teal.500"
                        onClick={handleResendOtp}
                        isDisabled={isOtpSent} // Disable button while OTP is being sent
                      >
                        {isOtpSent ? <Spinner size="sm" /> : "Resend OTP"}
                      </Button>
                      <Button
                        colorScheme="teal"
                        onClick={() => setStep(3)}
                        isDisabled={!otp}
                      >
                        Verify OTP
                      </Button>
                    </HStack>
                  </>
                )}

                {step === 3 && (
                  <>
                    <Text>Enter your new password:</Text>
                    <Input
                      type="password"
                      placeholder="New Password"
                      size="lg"
                      focusBorderColor="teal.500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      colorScheme="blue"
                      w="full"
                      mt={4}
                      onClick={handleResetPassword}
                      isDisabled={!newPassword}
                    >
                      Reset Password
                    </Button>
                  </>
                )}
              </VStack>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Container>
  );
};

export default ResetPassword;
