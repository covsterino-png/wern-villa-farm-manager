import HomeScreenLayoutSettings from "./HomeScreenLayoutSettings";

export default function PersonalSettings({ user }) {
  return (
    <div>
      <h1 style={{ color: "#03a9f4", marginBottom: "20px" }}>⚙️ Settings</h1>
      <HomeScreenLayoutSettings user={user} />
    </div>
  );
}
