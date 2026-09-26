import ProfileInsideCabin from "./ProfileInsideCabin";
import type { Profile } from "../types";
import image from "../assets/bendiprofile2.jpeg";
const profile: Profile = {
    id: "bendi",
    name: "Bendi",
    floorNumber: "02",
    role: "DJ",
    genre: "Ascenseur House",
    image,
    bio: "Los Angeles native Bendi brings a late-night edge to Ascenseur House, building sets around deep grooves, driving house, and tracks made to keep the room moving. His sound is clean, energetic, and constantly shifting, with an instinct for knowing when to hold a groove and when to push it to the next level.",
    socials: {
      soundcloud: "https://soundcloud.com/ascenseur-house",
    },
  };
export default function ProfilePage({ visible }: { visible: boolean }) {
 return <ProfileInsideCabin profile={profile} visible={visible} />;
}
// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [image];
