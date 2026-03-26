import LandingFeatures from "../components/landing/LandingFeatures";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHero from "../components/landing/LandingHero";
import LandingHowItWorks from "../components/landing/LandingHowItWorks";
import LandingNavbar from "../components/landing/LandingNavbar";

function HomePage() {
  return (
    <div className="home-shell">
      <LandingNavbar />

      <main className="w-full overflow-hidden">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;
