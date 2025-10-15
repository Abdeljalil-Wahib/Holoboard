// src/app/(home)/layout.tsx
import Image from "next/image";
import AnimatedBackground from "../components/AnimatedBackground";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {/* The Image component for the background lives here */}
      <div className="fixed h-screen w-screen -z-10">
        <Image
          src="/images/hero-bg.png" // Ensure your image name is correct
          alt="Holographic whiteboard background"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center 40%", // Keep our manual adjustment
          }}
        />
        {/* The dark overlay */}
        <div className="absolute inset-0 bg-background/70" />
      </div>
      {/* Layer 2: The Live Particle Animation */}
      <div className="fixed h-screen w-screen -z-10">
        <AnimatedBackground />
      </div>
      {/* The homepage content will be rendered here */}
      {children}
    </div>
  );
}