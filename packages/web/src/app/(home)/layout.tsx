import Image from "next/image";
import AnimatedBackground from "../components/AnimatedBackground";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="fixed h-screen w-screen -z-10">
        <Image
          src="/images/hero-bg.png"
          alt="Holographic whiteboard background"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>
      <div className="fixed h-screen w-screen -z-10">
        <AnimatedBackground />
      </div>
      {children}
    </div>
  );
}