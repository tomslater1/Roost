import { createContext, useContext, useState, ReactNode } from "react";

interface QuickAddContextType {
  shoppingOpen: boolean;
  expenseOpen: boolean;
  choreOpen: boolean;
  openShopping: () => void;
  openExpense: () => void;
  openChore: () => void;
  closeAll: () => void;
}

const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [choreOpen, setChoreOpen] = useState(false);

  const closeAll = () => {
    setShoppingOpen(false);
    setExpenseOpen(false);
    setChoreOpen(false);
  };

  return (
    <QuickAddContext.Provider
      value={{
        shoppingOpen,
        expenseOpen,
        choreOpen,
        openShopping: () => { closeAll(); setShoppingOpen(true); },
        openExpense: () => { closeAll(); setExpenseOpen(true); },
        openChore: () => { closeAll(); setChoreOpen(true); },
        closeAll,
      }}
    >
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error("useQuickAdd must be used within QuickAddProvider");
  }
  return context;
}
