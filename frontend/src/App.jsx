import { useEffect, useMemo, useState } from "react";
import { apiGet } from "./api/client.js";
import { clearAccessContext, loadAccessContext, saveAccessContext } from "./api/accessContext.js";
import AppHeader from "./components/AppHeader.jsx";
import AlertBox from "./components/AlertBox.jsx";
import IncomingTransfers from "./pages/IncomingTransfers.jsx";
import OutgoingTransfers from "./pages/OutgoingTransfers.jsx";
import TransferDogForm from "./pages/TransferDogForm.jsx";
import RegisterDog from "./pages/RegisterDog.jsx";
import TransferStatus from "./pages/TransferStatus.jsx";
import CitizenHome from "./pages/CitizenHome.jsx";
import LandingPage from "./pages/LandingPage.jsx";

const DEMO_CITIZEN_USER_ID = 1001;

const rolePages = {
  CITIZEN: [
    { id: "citizen-home", label: "Citizen Dashboard" },
    { id: "register-dog", label: "Register a New Dog" },
    { id: "request-transfer", label: "Move Dog to Another Municipality" },
    { id: "transfer-status", label: "My Transfers" },
  ],
  MUNICIPALITY: [
    { id: "outgoing-transfers", label: "Outgoing Transfers" },
    { id: "incoming-transfers", label: "Incoming Transfers" },
  ],
};

export default function App() {
  const storedContext = loadAccessContext();
  const [selectedTenant, setSelectedTenant] = useState(storedContext?.selectedMunicipalityCode || "BERLIN");
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState(storedContext?.selectedMunicipality || "Berlin");
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(storedContext?.selectedMunicipalityId || null);
  const [selectedRole, setSelectedRole] = useState(storedContext?.selectedRole || "CITIZEN");
  const [activePage, setActivePage] = useState(storedContext?.selectedRole === "MUNICIPALITY" ? "outgoing-transfers" : "citizen-home");
  const [showLanding, setShowLanding] = useState(!storedContext?.selectedRole);
  const [selectedChip, setSelectedChip] = useState("");
  const [selectedTransferRegistrationId, setSelectedTransferRegistrationId] = useState(storedContext?.selectedTransferRegistrationId || null);
  const [tenants, setTenants] = useState([]);
  const [health, setHealth] = useState(null);
  const [shellError, setShellError] = useState("");

  const pages = useMemo(() => rolePages[selectedRole], [selectedRole]);

  useEffect(() => {
    if (!pages?.some((page) => page.id === activePage)) {
      setActivePage(pages?.[0]?.id || "citizen-home");
    }
  }, [selectedRole]);

  useEffect(() => {
    let isMounted = true;

    async function loadShellData() {
      try {
        setShellError("");
        const [healthData, tenantsData] = await Promise.all([apiGet("/health"), apiGet("/mandanten")]);

        if (!isMounted) {
          return;
        }

        setHealth(healthData);
        setTenants(tenantsData || []);
        if (!selectedMunicipalityId) {
          const berlin = tenantsData?.find((tenant) => tenant.code === "BERLIN");
          if (berlin) {
            setSelectedTenant(berlin.code);
            setSelectedMunicipalityName(berlin.name);
            setSelectedMunicipalityId(berlin.id);
          }
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setHealth({ status: "offline" });
        setTenants([]);
        setShellError(err.message);
      }
    }

    loadShellData();

    return () => {
      isMounted = false;
    };
  }, []);

  function renderPage() {
    const common = {
      selectedTenant,
      selectedMunicipalityName,
      selectedRole,
      selectedMunicipalityId,
      selectedChip,
      setSelectedChip,
      currentUserId: DEMO_CITIZEN_USER_ID,
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
        return <TransferStatus selectedTenant={selectedTenant} selectedMunicipalityId={selectedMunicipalityId} tenants={tenants} />;
      case "incoming-transfers":
        return <IncomingTransfers {...common} />;
      case "outgoing-transfers":
        return <OutgoingTransfers {...common} />;
      default:
        return selectedRole === "CITIZEN" ? <CitizenHome {...common} /> : <OutgoingTransfers {...common} />;
    }
  }

  function openRole(role, municipality = null) {
    if (role === "CITIZEN") {
      const context = { selectedRole: "CITIZEN", selectedMunicipality: "Berlin", selectedMunicipalityCode: "BERLIN", selectedMunicipalityId, currentUserId: DEMO_CITIZEN_USER_ID };
      setSelectedRole("CITIZEN");
      setActivePage("citizen-home");
      setSelectedTransferRegistrationId(null);
      saveAccessContext(context);
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
      setActivePage("incoming-transfers");
      saveAccessContext(context);
    }

    setShowLanding(false);
  }

  function switchAccess() {
    clearAccessContext();
    setShowLanding(true);
  }

  if (showLanding) {
    return <LandingPage onOpenRole={openRole} municipalities={tenants} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
          <AlertBox type="warning" title="Backend status unavailable">
            {shellError}
          </AlertBox>
        ) : null}
        {renderPage()}
      </main>
    </div>
  );
}
