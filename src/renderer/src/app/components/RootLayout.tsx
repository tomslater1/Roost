import { Outlet } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "../context/AppContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { QuickAddProvider } from "../context/QuickAddContext";

export function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <OnboardingProvider>
          <QuickAddProvider>
            <Outlet />
          </QuickAddProvider>
        </OnboardingProvider>
      </AppProvider>
    </AuthProvider>
  );
}
