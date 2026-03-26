import LandingFeatures from "../components/landing/LandingFeatures";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHero from "../components/landing/LandingHero";
import LandingHowItWorks from "../components/landing/LandingHowItWorks";
import LandingNavbar from "../components/landing/LandingNavbar";

function HomePage() {
  return (
    <div className="home-shell">
      <LandingNavbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;
