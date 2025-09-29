import React, { useState, useEffect } from "react";
import { getBuildings } from "./utils/api";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import LanguageSelector from "./components/LanguageSelector";

// Import your pages
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import FloorSelectionPage from "./pages/FloorSelectionPage";
import RoomSelectionPage from "./pages/RoomSelectionPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookingsTable from "./pages/AdminBookingsTable";

function AppContent() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("landing");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const { t } = useTranslation();

  // Load user from localStorage on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load buildings data for admin functionality
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await getBuildings();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      } catch (error) {
        console.error('Failed to load buildings:', error);
        setBuildings([]);
      }
    };

    if (user) {
      loadBuildings();
    }
  }, [user]);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setStep("landing");
    setSelectedBuilding(null);
    setSelectedFloor(null);
  };

  // Navigation handlers
  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building);
    setStep("floors");
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
    setStep("rooms");
  };

  const handleBackToBuildings = () => {
    setStep("landing");
    setSelectedBuilding(null);
    setSelectedFloor(null);
  };

  const handleBackToFloors = () => {
    setStep("floors");
    setSelectedFloor(null);
  };

  // Greeting component
  const greeting = (
    <div style={{ position: "absolute", top: 10, right: 20, fontWeight: "bold" }}>
      {t('welcome')}, {user?.name}
      <button
        onClick={handleLogout}
        style={{
          marginLeft: "1rem",
          padding: "4px 8px",
          fontSize: "0.9rem",
          cursor: "pointer",
          background: "#eee",
          border: "1px solid #ccc",
          borderRadius: "4px"
        }}
      >
        {t('logout')}
      </button>
    </div>
  );

  // Render flow
  if (!user) {
    return (
      <>
        <AuthPage onLogin={setUser} />
        <LanguageSelector />
      </>
    );
  }

  if (user.role === "admin") {
    if (step === "admin-bookings") {
      return (
        <>
          <AdminBookingsTable 
            buildings={buildings} 
            currentUser={user} 
            onLogout={handleLogout}
            onBack={() => setStep("admin-dashboard")}
          />
          <LanguageSelector />
        </>
      );
    }
    
    return (
      <>
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout}
          onNavigateToBookings={() => setStep("admin-bookings")}
        />
        <LanguageSelector />
      </>
    );
  }

  if (step === "landing") {
    return (
      <>
        {greeting}
        <LandingPage onSelectBuilding={handleBuildingSelect} />
        <LanguageSelector />
      </>
    );
  }

  if (step === "floors" && selectedBuilding) {
    return (
      <>
        {greeting}
        <FloorSelectionPage
          building={selectedBuilding}
          onSelectFloor={handleFloorSelect}
          onBack={handleBackToBuildings}
        />
        <LanguageSelector />
      </>
    );
  }

  if (step === "rooms" && selectedBuilding && selectedFloor) {
    return (
      <>
        {greeting}
        <RoomSelectionPage
          building={selectedBuilding}
          floor={selectedFloor}
          onBack={handleBackToFloors}
          currentUser={user}
        />
        <LanguageSelector />
      </>
    );
  }

  return <LanguageSelector />;
}

function AppWithProvider() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default AppWithProvider;