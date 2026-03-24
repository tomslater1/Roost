import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DatePicker } from "./ui/DatePicker";
import { useApp } from "../context/AppContext";

export function QuickAddShoppingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addShoppingItem } = useApp();
  const [itemName, setItemName] = useState("");

  const handleAdd = () => {
    if (!itemName.trim()) return;
    addShoppingItem(itemName);
    setItemName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add shopping item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="item-name">Item name</Label>
            <Input
              id="item-name"
              placeholder="e.g., Milk, Bread, Eggs"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add item</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuickAddExpenseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addExpense, currentUser } = useApp();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState<Date>(new Date());

  const handleAdd = () => {
    if (!title.trim() || !amount) return;
    
    addExpense({
      title,
      amount: parseFloat(amount),
      payer: currentUser,
      date,
      type: "one-off",
      category,
      splitType: "shared",
    });
    
    setTitle("");
    setAmount("");
    setCategory("Food & Dining");
    setDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="expense-title">Description</Label>
            <Input
              id="expense-title"
              placeholder="e.g., Groceries, Dinner, Uber"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="expense-amount">Amount (£)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Housing">Housing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add expense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuickAddChoreModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addChore, currentUser, partnerName } = useApp();
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUser);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const handleAdd = () => {
    if (!title.trim()) return;
    
    addChore({
      title,
      assignedTo,
      dueDate: dueDate || null,
      completed: false,
      frequency: "one-time",
    });
    
    setTitle("");
    setAssignedTo(currentUser);
    setDueDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add chore</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="chore-title">Task</Label>
            <Input
              id="chore-title"
              placeholder="e.g., Vacuum living room, Take out bins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label>Assigned to</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentUser}>{currentUser}</SelectItem>
                <SelectItem value={partnerName}>{partnerName}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Due date (optional)</Label>
            <DatePicker value={dueDate} onChange={setDueDate} placeholder="No due date" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add chore</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
