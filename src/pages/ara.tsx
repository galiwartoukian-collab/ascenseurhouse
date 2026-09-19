import ProfileInsideCabin from "./ProfileInsideCabin";
import type { Profile } from "../types";
import image from "../assets/ara.jpeg";
const profile: Profile = {
    id: "ara",
    name: "Ara",
    floorNumber: "01",
    role: "Resident DJ",
    genre: "House / Open Format",
    image,
    bio: "Ara is a bi-coastal DJ blending house music and Middle Eastern remixes with the energy of late nights in LA and NYC. Inspired by the Ascenseur House aesthetic, his sets move through different levels of bass, tempo, and tension, building from dark late-night sounds into high-energy moments that keep the room moving.",
    socials: {
      instagram: "https://www.instagram.com/arahartounian?igsh=NTc4MTIwNjQ2YQ==",
      tiktok: "https://www.tiktok.com/@aleppoara?_r=1&_t=ZT-96GNZLZe5tN",
      soundcloud: "https://on.soundcloud.com/1j3fyk9eTVGEHrPnKG",
    },
  };
export default function ProfilePage({ visible }: { visible: boolean }) {
 return <ProfileInsideCabin profile={profile} visible={visible} />;
}
// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [image];
