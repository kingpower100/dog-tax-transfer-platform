const STORAGE_KEY = "dogTaxAccessContext";

export function loadAccessContext() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.selectedRole) {
      return stored;
    }
  } catch {
    return null;
  }
  return null;
}

export function saveAccessContext(context) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function clearAccessContext() {
  localStorage.removeItem(STORAGE_KEY);
}

export function apiRole(selectedRole) {
  return selectedRole === "CITIZEN" ? "citizen" : "municipality_admin";
}
