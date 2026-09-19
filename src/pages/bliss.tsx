import ProfileInsideCabin from "./ProfileInsideCabin";
import type { Profile } from "../types";
import image from "../assets/blisseliss.jpg";
const profile: Profile = {
    id: "bliss",
    name: "Bliss Eliss",
    floorNumber: "04",
    role: "Manager",
    genre: "Bookings / Talent Curation / Event Direction",
    image,
    bio: "Bliss Eliss oversees the experience behind the scenes, handling bookings, artist coordination, and the overall shape of each night with precision and style.",
  };
export default function ProfilePage({ visible }: { visible: boolean }) {
 return <ProfileInsideCabin profile={profile} visible={visible} />;
}
// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [image];
