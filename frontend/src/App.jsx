import { useEffect, useMemo, useState } from "react";
import { apiGet } from "./api/client.js";
import { clearAccessContext, loadAccessContext, saveAccessContext } from "./api/accessContext.js";
import AppHeader from "./components/AppHeader.jsx";
import AlertBox from "./components/AlertBox.jsx";
import DemoSwitcherBar from "./components/DemoSwitcherBar.jsx";
import CitizenLoginPage from "./pages/CitizenLoginPage.jsx";
import IncomingTransfers from "./pages/IncomingTransfers.jsx";
import OutgoingTransfers from "./pages/OutgoingTransfers.jsx";
import TransferDogForm from "./pages/TransferDogForm.jsx";
import RegisterDog from "./pages/RegisterDog.jsx";
import TransferStatus from "./pages/TransferStatus.jsx";
import CitizenHome from "./pages/CitizenHome.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PlatformOverview from "./pages/PlatformOverview.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tenants from "./pages/Tenants.jsx";
import Dogs from "./pages/Dogs.jsx";
import Registrations from "./pages/Registrations.jsx";
import Transfers from "./pages/Transfers.jsx";
import TaxRules from "./pages/TaxRules.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

// Citizen role has one "home" — sub-pages are navigated from within the portal
const rolePages = {
  CITIZEN: [
    { id: "citizen-home", label: "Mein Portal" },
  ],
  MUNICIPALITY: [
    { id: "outgoing-transfers", label: "Abmeldung (Outgoing)" },
    { id: "incoming-transfers", label: "Anmeldung (Incoming)" },
  ],
  PLATFORM_ADMIN: [
    { id: "platform-overview", label: "Platform Overview" },
    { id: "dashboard", label: "Dashboard" },
    { id: "tenants", label: "Municipalities" },
    { id: "all-dogs", label: "All Dogs" },
    { id: "all-registrations", label: "Registrations" },
    { id: "all-transfers", label: "All Transfers" },
    { id: "tax-rules", label: "Tax Rules" },
    { id: "audit-logs", label: "Audit Logs" },
  ],
};

export default function App() {
  const storedContext = loadAccessContext();

  const [selectedTenant, setSelectedTenant] = useState(storedContext?.selectedMunicipalityCode || "BERLIN");
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState(storedContext?.selectedMunicipality || "Berlin");
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(storedContext?.selectedMunicipalityId || null);
  const [selectedRole, setSelectedRole] = useState(storedContext?.selectedRole || "CITIZEN");
  const [activePage, setActivePage] = useState(() => {
    if (storedContext?.selectedRole === "MUNICIPALITY") return "outgoing-transfers";
    if (storedContext?.selectedRole === "PLATFORM_ADMIN") return "platform-overview";
    return "citizen-home";
  });
  const [showLanding, setShowLanding] = useState(!storedContext?.selectedRole);
  const [showCitizenLogin, setShowCitizenLogin] = useState(false);

  // Citizen identity — null means not logged in yet
  const [currentUserId, setCurrentUserId] = useState(storedContext?.currentUserId || null);
  const [currentCitizen, setCurrentCitizen] = useState(null);

  const [selectedChip, setSelectedChip] = useState("");
  const [selectedTransferRegistrationId, setSelectedTransferRegistrationId] = useState(
    storedContext?.selectedTransferRegistrationId || null,
  );
  const [tenants, setTenants] = useState([]);
  const [health, setHealth] = useState(null);
  const [shellError, setShellError] = useState("");

  const pages = useMemo(() => rolePages[selectedRole] || rolePages.CITIZEN, [selectedRole]);

  // Keep active page valid when role changes
  useEffect(() => {
    if (!pages?.some((page) => page.id === activePage)) {
      setActivePage(pages?.[0]?.id || "citizen-home");
    }
  }, [selectedRole]);

  // Load health + tenants on mount
  useEffect(() => {
    let isMounted = true;

    async function loadShellData() {
      try {
        setShellError("");
        const [healthData, tenantsData] = await Promise.all([apiGet("/health"), apiGet("/mandanten")]);

        if (!isMounted) return;

        setHealth(healthData);
        setTenants(tenantsData || []);

        if (!selectedMunicipalityId) {
          const berlin = tenantsData?.find((t) => t.code === "BERLIN");
          if (berlin) {
            setSelectedTenant(berlin.code);
            setSelectedMunicipalityName(berlin.name);
            setSelectedMunicipalityId(berlin.id);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setHealth({ status: "offline" });
        setTenants([]);
        setShellError(err.message);
      }
    }

    loadShellData();
    return () => { isMounted = false; };
  }, []);

  function renderPage() {
    const common = {
      selectedTenant,
      selectedMunicipalityName,
      selectedRole,
      selectedMunicipalityId,
      selectedChip,
      setSelectedChip,
      currentUserId,
      currentCitizen,
      selectedTransferRegistrationId,
      setSelectedTransferRegistrationId,
      setActivePage,
      tenants,
      health,
    };

    switch (activePage) {
      case "citizen-home":
        return <CitizenHome {...common} />;
      case "register-dog":
        return <RegisterDog {...common} />;
      case "request-transfer":
        return <TransferDogForm {...common} />;
      case "transfer-status":
        return (
          <TransferStatus
            selectedTenant={selectedTenant}
            selectedMunicipalityId={selectedMunicipalityId}
            tenants={tenants}
            currentUserId={currentUserId}
          />
        );
      case "incoming-transfers":
        return <IncomingTransfers {...common} />;
      case "outgoing-transfers":
        return <OutgoingTransfers {...common} />;
      case "platform-overview":
        return <PlatformOverview {...common} />;
      case "dashboard":
        return <Dashboard {...common} />;
      case "tenants":
        return <Tenants {...common} />;
      case "all-dogs":
        return <Dogs {...common} />;
      case "all-registrations":
        return <Registrations {...common} />;
      case "all-transfers":
        return <Transfers {...common} />;
      case "tax-rules":
        return <TaxRules {...common} />;
      case "audit-logs":
        return <AuditLogs {...common} />;
      default:
        if (selectedRole === "CITIZEN") return <CitizenHome {...common} />;
        if (selectedRole === "PLATFORM_ADMIN") return <PlatformOverview {...common} />;
        return <OutgoingTransfers {...common} />;
    }
  }

  function openRole(role, municipality = null) {
    if (role === "CITIZEN") {
      setSelectedRole("CITIZEN");
      setShowLanding(false);
      setShowCitizenLogin(true); // <— show citizen login instead of portal directly
      return;
    }

    if (role === "MUNICIPALITY" && municipality) {
      const context = {
        selectedRole: "MUNICIPALITY",
        selectedMunicipality: municipality.name,
        selectedMunicipalityCode: municipality.code,
        selectedMunicipalityId: municipality.id,
      };
      setSelectedRole("MUNICIPALITY");
      setSelectedTenant(municipality.code);
      setSelectedMunicipalityName(municipality.name);
      setSelectedMunicipalityId(municipality.id);
      setActivePage("outgoing-transfers");
      saveAccessContext(context);
    }

    if (role === "PLATFORM_ADMIN") {
      const context = { selectedRole: "PLATFORM_ADMIN", selectedMunicipality: "All", selectedMunicipalityCode: "ALL" };
      setSelectedRole("PLATFORM_ADMIN");
      setSelectedTenant("ALL");
      setSelectedMunicipalityName("All Municipalities");
      setActivePage("platform-overview");
      saveAccessContext(context);
    }

    setShowLanding(false);
  }

  // Called from CitizenLoginPage when a citizen card is selected
  function selectCitizen(citizen) {
    const context = {
      selectedRole: "CITIZEN",
      selectedMunicipality: "Berlin",
      selectedMunicipalityCode: "BERLIN",
      selectedMunicipalityId,
      currentUserId: citizen.id,
    };
    setCurrentUserId(citizen.id);
    setCurrentCitizen(citizen);
    setActivePage("citizen-home");
    setSelectedTransferRegistrationId(null);
    setShowCitizenLogin(false);
    saveAccessContext(context);
  }

  // Called from DemoSwitcherBar to switch municipality without going through landing
  function switchMunicipality(tenant) {
    const context = {
      selectedRole: "MUNICIPALITY",
      selectedMunicipality: tenant.name,
      selectedMunicipalityCode: tenant.code,
      selectedMunicipalityId: tenant.id,
    };
    setSelectedTenant(tenant.code);
    setSelectedMunicipalityName(tenant.name);
    setSelectedMunicipalityId(tenant.id);
    setActivePage("outgoing-transfers");
    saveAccessContext(context);
  }

  function switchAccess() {
    clearAccessContext();
    setCurrentUserId(null);
    setCurrentCitizen(null);
    setShowCitizenLogin(false);
    setShowLanding(true);
  }

  // --- Render routing ---

  if (showLanding) {
    return <LandingPage onOpenRole={openRole} municipalities={tenants} />;
  }

  if (showCitizenLogin) {
    return (
      <CitizenLoginPage
        onSelectCitizen={selectCitizen}
        onBack={switchAccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Municipality isolation debug bar — only for MUNICIPALITY role */}
      {selectedRole === "MUNICIPALITY" ? (
        <DemoSwitcherBar
          tenants={tenants}
          activeMunicipalityId={selectedMunicipalityId}
          onSelectMunicipality={switchMunicipality}
        />
      ) : null}

      <AppHeader
        activePage={activePage}
        health={health}
        pages={pages}
        selectedRole={selectedRole}
        selectedTenant={selectedMunicipalityName}
        setActivePage={setActivePage}
        setShowLanding={switchAccess}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {shellError ? (
          <AlertBox type="warning" title="Backend nicht erreichbar / Backend unavailable">
            {shellError}
          </AlertBox>
        ) : null}
        {renderPage()}
      </main>
    </div>
  );
}
