import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 12; // Total number of onboarding steps

  // Auto-start on first launch — wait 800ms for the app to fully render first
  useEffect(() => {
    const completed = localStorage.getItem("roost_onboarding_completed");
    if (!completed) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOnboardingActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  };

  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    localStorage.setItem("roost_onboarding_completed", "true");
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
    localStorage.setItem("roost_onboarding_completed", "true");
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStep,
        totalSteps,
        startOnboarding,
        skipOnboarding,
        nextStep,
        prevStep,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}