# LoopTalk

LoopTalk is a Full Stack Chatting App.
Uses Socket.io for real time communication and stores user details in encrypted format in Mongo DB Database.

## Features

1. **Authentication**: Secure login and sign-up screens with email and password authentication.
2. **User Search**: Search for other users by email or username.
3. **Notifications**: Get notified instantly when a new message arrives.
4. **One-to-One Messaging**: Send direct messages to other users.
5. **Group Chats**: Create and manage group chats with multiple users.
6. **Broadcast Messages**: Send broadcast messages to selected users.
7. **Profile Viewing**: View profiles of groups and individual users, including own.
8. **Block/Unblock**: Block or unblock users to control who can send you messages.
9. **Real-Time Chat**: Enjoy real-time messaging with instant updates.
10. **Typing Indicators**: See when someone is typing a message in real-time.
11. **Reset Password**: Reset user password using an OTP sent to user's email.

## Tech Stack

**Client:** React JS

**Server:** Node JS, Express JS

**Database:** Mongo DB

## Demo

## Run Locally

Clone the project

```bash
  git clone https://github.com/nikhil6g/LoopTalk
```

Go to the project directory

```bash
  cd LoopTalk
```

Install dependencies

```bash
  npm install
```

```bash
  cd frontend/
  npm install
```

Create .env file in root folder and assign these variables with suitable values

MONGO_URI=
JWT_SECRET=
PORT=
EMAIL_ID=
EMAIL_APP_PASSWORD=

Start the server

```bash
  npm run start
```

Start the Client

```bash
  //open now terminal
  cd frontend
  npm start
```

# Screenshots

### Authenticaton

### Real Time Chatting with Typing indicators

### One to One chat

### Search Users

### Create Group Chats

### Notifications

### Add or Remove users from group

### View Other user Profile

## Made By

- [@nikhil](https://github.com/nikhil6g)
