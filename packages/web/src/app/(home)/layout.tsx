import AnimatedBackground from "../components/AnimatedBackground";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div
        className="fixed h-screen w-screen -z-10 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/images/hero-bg.png)",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <AnimatedBackground />
      </div>
      {children}
    </div>
  );
}
