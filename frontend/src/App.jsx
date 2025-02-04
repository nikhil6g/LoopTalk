import "./App.css";
import Homepage from "./Pages/Homepage";
import { Routes, Route } from "react-router-dom";
import Chatpage from "./Pages/Chatpage";
import ResetPassword from "./Pages/Resetpasswordpage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Homepage />} exact />
        <Route path="/chats" element={<Chatpage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}

export default App;
