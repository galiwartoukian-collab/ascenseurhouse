import ProfileInsideCabin from "./ProfileInsideCabin";
import type { Profile } from "../types";
import image from "../assets/anais.png";
const profile: Profile = {
    id: "anais",
    name: "Anaïs",
    floorNumber: "03",
    role: "Resident DJ",
    genre: "MINIMAL BASS / TECH HOUSE",
    image,
    bio: "Anaïs brings a stripped-back blend of minimal bass and tech house shaped by late nights, travel, and underground dance culture. Based in Los Angeles but constantly between cities, her sets are built on deep grooves, rolling basslines, and clean transitions that keep the room locked in from start to finish. Whether it’s a rooftop party, warehouse set, or intimate after-hours crowd, Anaïs focuses on rhythm, tension, and creating an atmosphere that feels effortless but impossible to ignore.",
    socials: {
      instagram: "https://www.instagram.com/theofficialanais?igsh=NTc4MTIwNjQ2YQ==",
      soundcloud: "https://soundcloud.com/theofficialanais",
    },
  };
export default function ProfilePage({ visible }: { visible: boolean }) {
 return <ProfileInsideCabin profile={profile} visible={visible} />;
}
// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [image];
