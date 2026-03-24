import { useState } from "react";
import { Copy, Check, Home, Pencil, Users, UserPlus } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useHome } from "@/hooks/useHome";
import { useAuthContext } from "@/context/AuthContext";
import { MemberAvatar } from "../../components/MemberAvatar";

export function Household() {
  const { householdName, updateHouseholdName } = useApp();
  const { home, members } = useHome();
  const { user } = useAuthContext();
  const currentMember = members.find(m => m.user_id === user?.id);
  const partnerMember = members.find(m => m.user_id !== user?.id);
  const inviteCode = home?.invite_code ?? '--------';
  const inviteLink = `https://roost-website-five.vercel.app/join/${inviteCode}`;

  const [copied, setCopied] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(householdName);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === "code" ? "Invite code copied" : "Invite link copied");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    try {
      await updateHouseholdName(tempName.trim());
      setIsEditingName(false);
      toast.success("Home name updated");
    } catch {
      toast.error("Failed to update home name");
    }
  };

  const handleCancelEdit = () => {
    setTempName(householdName);
    setIsEditingName(false);
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Household name ── */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-medium mb-0.5">Household name</h3>
            <p className="text-sm text-muted-foreground">
              Give your home a name both of you will recognise.
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {isEditingName ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="householdName">Home name</Label>
                  <Input
                    id="householdName"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="e.g., The Smith House"
                    className="h-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveName} size="sm">Save</Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">Cancel</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{householdName}</p>
                    <p className="text-xs text-muted-foreground">Your household</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ── Members ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium mb-0.5">Members</h3>
              <p className="text-sm text-muted-foreground">
                {partnerMember
                  ? "Both members of your household."
                  : "Waiting for your partner to join."}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">
                {members.length} / 2
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <MemberAvatar
                displayName={currentMember?.display_name ?? 'Me'}
                avatarColor={currentMember?.avatar_color}
                avatarIcon={currentMember?.avatar_icon}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {currentMember?.display_name ?? 'You'}
                  </p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">You</Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{currentMember?.role ?? 'Member'}</p>
              </div>
            </div>

            {/* Partner or empty state */}
            <AnimatePresence mode="wait" initial={false}>
              {partnerMember ? (
                <motion.div
                  key="partner"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <MemberAvatar
                    displayName={partnerMember.display_name ?? 'Partner'}
                    avatarColor={partnerMember.avatar_color}
                    avatarIcon={partnerMember.avatar_icon}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{partnerMember.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{partnerMember.role}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border"
                >
                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Waiting for partner</p>
                    <p className="text-xs text-muted-foreground">Share the invite below to get them in</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* ── Invite ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-0.5">Invite your partner</h3>
              <p className="text-sm text-muted-foreground">
                Send them the code or link — they enter it on the Join screen to connect to your household.
              </p>
            </div>
          </div>

          {/* Invite code */}
          <div className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-muted/30">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Invite code</p>
              <code className="font-mono text-lg font-semibold tracking-widest">{inviteCode}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(inviteCode, "code")}
              className="flex-shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied === "code" ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-success" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy code
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Deep link */}
          <div className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-muted/30">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Invite link</p>
              <p className="text-sm font-mono truncate text-muted-foreground">{inviteLink}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(inviteLink, "link")}
              className="flex-shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied === "link" ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-success" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy link
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
