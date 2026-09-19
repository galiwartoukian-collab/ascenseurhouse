import ProfileInsideCabin from "./ProfileInsideCabin";
import type { Profile } from "../types";
import image from "../assets/bendiprofile.jpeg";
const profile: Profile = {
    id: "bendi",
    name: "Bendi",
    floorNumber: "03",
    role: "DJ",
    genre: "Ascenseur House",
    image,
    bio: "Biography coming soon.",
  };
export default function ProfilePage({ visible }: { visible: boolean }) {
 return <ProfileInsideCabin profile={profile} visible={visible} />;
}
// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [image];
