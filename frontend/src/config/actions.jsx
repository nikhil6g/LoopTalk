import axios from "axios";

export const uploadToCloudinary = async (
  file,
  folderName = "loop-talk-media",
  onProgress = null,
  initialProgress = 0
) => {
  if (!file) throw new Error("No file provided");

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  data.append("folder", folderName);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    data,
    {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 50) / progressEvent.total
          );
          onProgress(initialProgress + percentCompleted);
        }
      },
    }
  );

  const { secure_url: url, resource_type } = response.data;
  return { url, resource_type };
};
