import { Outlet } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "../context/AppContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { QuickAddProvider } from "../context/QuickAddContext";
import { SubscriptionUiProvider } from "../context/SubscriptionUiContext";

export function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <OnboardingProvider>
          <SubscriptionUiProvider>
            <QuickAddProvider>
              <Outlet />
            </QuickAddProvider>
          </SubscriptionUiProvider>
        </OnboardingProvider>
      </AppProvider>
    </AuthProvider>
  );
}
