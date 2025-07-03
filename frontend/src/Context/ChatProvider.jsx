import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);

    // Only redirect if the user is trying to access a protected route
    const isProtectedRoute = ["/chats"].includes(location.pathname);

    if (!userInfo && isProtectedRoute) {
      navigate("/");
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_APP_SOKCET_ENDPOINT, {
        auth: {
          token: user.token,
        },
      });

      newSocket.emit("setup", user);
      newSocket.on("connected", () => setSocketConnected(true));

      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        socket,
        socketConnected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
