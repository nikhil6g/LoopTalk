import { Box, Text, Image } from "@chakra-ui/react";

const MessageBubble = ({ message }) => {
  const renderMedia = () => {
    const media = message.media;
    if (!media || !media.url) return null;

    const fileType = media.type;

    if (fileType.startsWith("image")) {
      return (
        <Image
          src={media.url}
          alt="media"
          borderRadius="10px"
          maxW="300px"
          maxH="300px"
          mb={message.content ? 2 : 0}
        />
      );
    }

    // if (fileType.startsWith("video")) {
    //   return (
    //     <video
    //       src={media.url}
    //       controls
    //       style={{
    //         borderRadius: "10px",
    //         maxWidth: "300px",
    //         maxHeight: "300px",
    //         marginBottom: message.content ? 8 : 0,
    //       }}
    //     />
    //   );
    // }

    // Other file types (e.g., PDF, docs)
    return (
      <a href={media.url} target="_blank" rel="noopener noreferrer">
        📎 {media.url.split("/").pop()}
      </a>
    );
  };

  return (
    <Box>
      {["media", "media+text"].includes(message.type) && renderMedia()}
      {message.content && <Text>{message.content}</Text>}
    </Box>
  );
};

export default MessageBubble;
