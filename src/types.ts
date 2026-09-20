export type TravelState = "idle" | "closing" | "traveling" | "opening";
export type BookingSubmitStatus = "idle" | "sending" | "success" | "error";
export type Stop = "about" | "ara" | "anais" | "bendi" | "bliss" | "booking";
export type ProfileStop = Extract<Stop, "ara" | "anais" | "bendi" | "bliss">;
export type FloorCode = "A" | "01" | "02" | "03" | "04" | "B";

export type ProfileSocials = {
  instagram?: string;
  tiktok?: string;
  soundcloud?: string;
};

export type Profile = {
  id: "ara" | "anais" | "bendi" | "bliss";
  name: string;
  floorNumber: "01" | "02" | "03" | "04";
  role: string;
  genre: string;
  image: string;
  desktopImage?: string;
  bio: string;
  socials?: ProfileSocials;
};


export type NavigationHandler = () => boolean;
