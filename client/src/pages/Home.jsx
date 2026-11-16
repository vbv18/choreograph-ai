import SideBar from "../components/SideBar.jsx";
import ChatArea from "../components/ChatArea.jsx";
import Artifact from "../components/Artifact.jsx";

export default function Home() {
  return (
    <div className="h-dvh min-w-0 flex bg-[#0d0f14] text-white overflow-hidden w-full">
      <SideBar />
      <ChatArea />
      <Artifact />
    </div>
  );
}
