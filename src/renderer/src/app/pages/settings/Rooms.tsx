import { useState } from "react";
import { Plus, Trash2, Check, Pencil, X, Home, Sparkles, Layers, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { RoomIcon } from "../../components/RoomIcon";
import { useRooms } from "@/hooks/useRooms";
import { useRoomGroups } from "@/hooks/useRoomGroups";
import { PRESET_ROOMS, ROOM_ICON_OPTIONS, SYSTEM_GROUPS, GROUP_ICON_OPTIONS } from "@/lib/rooms";

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

// ── Room inline edit row ─────────────────────────────────────────────────────

function RoomEditRow({
  initialName, initialIcon, currentIcon, onSave, onClose,
}: {
  initialName: string; initialIcon: string; currentIcon: string
  onSave: (name: string, icon: string) => void; onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== initialName) onSave(trimmed, icon)
  }

  const handleIconClick = (iconName: string) => {
    setIcon(iconName)
    onSave(name.trim() || initialName, iconName)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease }}
      className="overflow-hidden"
    >
      <div className="mt-2 p-4 rounded-xl bg-muted/40 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") { commitName(); onClose() }
              if (e.key === "Escape") onClose()
            }}
            autoFocus
            className="bg-background"
            placeholder="Room name"
          />
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROOM_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.iconName}
              type="button"
              title={opt.name}
              onClick={() => handleIconClick(opt.iconName)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                (icon === opt.iconName || (!icon && opt.iconName === currentIcon))
                  ? "bg-primary/15 ring-2 ring-primary/40 scale-110 text-primary"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <RoomIcon iconName={opt.iconName} className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Changes save automatically</p>
      </div>
    </motion.div>
  )
}

// ── Group inline edit row ────────────────────────────────────────────────────

function GroupEditRow({
  initialName, initialIcon, memberRoomIds, rooms, onSave, onClose,
}: {
  initialName: string; initialIcon: string; memberRoomIds: string[]
  rooms: { id: string; name: string; icon: string }[]
  onSave: (name: string, icon: string, roomIds: string[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  const [selected, setSelected] = useState<Set<string>>(new Set(memberRoomIds))

  const toggleRoom = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== initialName) onSave(trimmed, icon, [...selected])
  }

  const handleIconClick = (iconName: string) => {
    setIcon(iconName)
    onSave(name.trim() || initialName, iconName, [...selected])
  }

  const handleRoomToggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    onSave(name.trim() || initialName, icon, [...next])
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease }}
      className="overflow-hidden"
    >
      <div className="mt-2 p-4 rounded-xl bg-muted/40 border border-border space-y-4">
        {/* Name */}
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") { commitName(); onClose() }
              if (e.key === "Escape") onClose()
            }}
            autoFocus
            className="bg-background"
            placeholder="Group name"
          />
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Icon picker */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Icon</p>
          <div className="flex flex-wrap gap-1.5">
            {GROUP_ICON_OPTIONS.map((opt) => (
              <button
                key={opt.iconName}
                type="button"
                title={opt.name}
                onClick={() => handleIconClick(opt.iconName)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  icon === opt.iconName
                    ? "bg-primary/15 ring-2 ring-primary/40 scale-110 text-primary"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <RoomIcon iconName={opt.iconName} className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Room membership */}
        {rooms.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Rooms in this group</p>
            <div className="flex flex-wrap gap-2">
              {rooms.map((room) => {
                const on = selected.has(room.id)
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleRoomToggle(room.id)}
                    className={[
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition-all duration-150",
                      on
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-background hover:bg-muted/60 text-foreground",
                    ].join(" ")}
                  >
                    <RoomIcon iconName={room.icon} className="w-3.5 h-3.5" />
                    {room.name}
                    {on && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Changes save automatically</p>
      </div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useRooms()
  const { groups, addGroup, updateGroup, setGroupMembers, deleteGroup } = useRoomGroups()

  // Room editing state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [customRoomName, setCustomRoomName] = useState("")
  const [customRoomIcon, setCustomRoomIcon] = useState(ROOM_ICON_OPTIONS[0].iconName)

  // Group editing / creation state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupIcon, setNewGroupIcon] = useState(GROUP_ICON_OPTIONS[0].iconName)
  const [newGroupRooms, setNewGroupRooms] = useState<Set<string>>(new Set())

  const roomNames = new Set(rooms.map((r) => r.name.toLowerCase()))
  const groupNames = new Set(groups.map((g) => g.name.toLowerCase()))

  // ── Room handlers ──────────────────────────────────────────
  const handleAddPreset = (name: string, iconName: string) => {
    addRoom.mutate({ name, icon: iconName })
  }

  const handleRoomAutoSave = (id: string, name: string, icon: string) => {
    updateRoom.mutate({ id, name, icon })
  }

  const handleAddCustomRoom = () => {
    const name = customRoomName.trim()
    if (!name || roomNames.has(name.toLowerCase())) return
    addRoom.mutate({ name, icon: customRoomIcon }, {
      onSuccess: () => { setCustomRoomName(""); setCustomRoomIcon(ROOM_ICON_OPTIONS[0].iconName) },
    })
  }

  // ── Group handlers ──────────────────────────────────────────
  const handleGroupAutoSave = (id: string, name: string, icon: string, roomIds: string[]) => {
    updateGroup.mutate({ id, name, icon })
    setGroupMembers.mutate({ groupId: id, roomIds })
  }

  const handleAddGroup = () => {
    const name = newGroupName.trim()
    if (!name || groupNames.has(name.toLowerCase())) return
    addGroup.mutate(
      { group: { name, icon: newGroupIcon }, roomIds: [...newGroupRooms] },
      {
        onSuccess: () => {
          setShowNewGroup(false)
          setNewGroupName("")
          setNewGroupIcon(GROUP_ICON_OPTIONS[0].iconName)
          setNewGroupRooms(new Set())
        },
      }
    )
  }

  // All system groups are always visible — "All Bedrooms"/"All Bathrooms" show empty until matching rooms are added
  const visibleSystemGroups = SYSTEM_GROUPS

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Your rooms ──────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Your rooms</h3>
              <p className="text-sm text-muted-foreground">
                Every room in your home. Rename or remove any room at any time.
              </p>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No rooms added yet — use the suggestions below.
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <div className="group">
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <RoomIcon iconName={room.icon} className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{room.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditingRoomId(editingRoomId === room.id ? null : room.id)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => {
                              if (editingRoomId === room.id) setEditingRoomId(null)
                              deleteRoom.mutate({ id: room.id, name: room.name })
                            }}
                            disabled={deleteRoom.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingRoomId === room.id && (
                          <RoomEditRow
                            initialName={room.name}
                            initialIcon={room.icon}
                            currentIcon={room.icon}
                            onSave={(n, i) => handleRoomAutoSave(room.id, n, i)}
                            onClose={() => setEditingRoomId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preset suggestions ──────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Common rooms in most homes. Tap to add any that apply to yours.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_ROOMS.map((preset) => {
              const added = roomNames.has(preset.name.toLowerCase())
              return (
                <div
                  key={preset.name}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    added ? "bg-muted/30 border-border opacity-60"
                          : "bg-card border-border hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <RoomIcon iconName={preset.iconName} className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm truncate">{preset.name}</span>
                  </div>
                  {added ? (
                    <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      onClick={() => handleAddPreset(preset.name, preset.iconName)}
                      disabled={addRoom.isPending}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Create a custom room ────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h3 className="font-medium mb-1">Create a custom room</h3>
            <p className="text-sm text-muted-foreground">
              Name any space in your home and pick an icon that fits.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Room name</label>
            <Input
              placeholder="e.g. Snug, Playroom, Conservatory…"
              value={customRoomName}
              onChange={(e) => setCustomRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomRoom()}
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_ICON_OPTIONS.map((opt) => (
                <button key={opt.iconName} type="button" title={opt.name}
                  onClick={() => setCustomRoomIcon(opt.iconName)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    customRoomIcon === opt.iconName
                      ? "bg-primary/15 ring-2 ring-primary/40 scale-110 text-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <RoomIcon iconName={opt.iconName} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <AnimatePresence>
              {customRoomName.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15, ease }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15"
                >
                  <RoomIcon iconName={customRoomIcon} className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{customRoomName.trim()}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              onClick={handleAddCustomRoom}
              disabled={!customRoomName.trim() || roomNames.has(customRoomName.trim().toLowerCase()) || addRoom.isPending}
              className="gap-2 ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add room
            </Button>
          </div>
          {customRoomName.trim() && roomNames.has(customRoomName.trim().toLowerCase()) && (
            <p className="text-xs text-destructive -mt-2">A room with this name already exists.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Room groups ─────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium mb-1">Room groups</h3>
                <p className="text-sm text-muted-foreground">
                  Groups let you assign a chore to multiple rooms at once — useful for tasks like
                  "clean all bathrooms" or "tidy the whole house".
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => setShowNewGroup((v) => !v)}
              >
                <Plus className="w-3.5 h-3.5" />
                New group
              </Button>
            </motion.div>
          </div>

          <div className="space-y-1">
            {/* System groups — always shown, not editable */}
            {visibleSystemGroups.map((sg) => (
              <div
                key={sg.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <RoomIcon iconName={sg.icon} className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{sg.name}</span>
                    {sg.name === 'All Rooms' && (
                      <p className="text-xs text-muted-foreground">
                        Always includes every room you add
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Built-in</span>
                </div>
              </div>
            ))}

            {/* Custom groups */}
            <AnimatePresence mode="popLayout">
              {groups.map((group) => {
                const memberNames = group.room_group_members
                  .map((m) => rooms.find((r) => r.id === m.room_id)?.name)
                  .filter(Boolean) as string[]
                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <div className="group/item">
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <RoomIcon iconName={group.icon} className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm">{group.name}</span>
                            {memberNames.length > 0 && (
                              <p className="text-xs text-muted-foreground truncate">
                                {memberNames.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditingGroupId(editingGroupId === group.id ? null : group.id)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => {
                              if (editingGroupId === group.id) setEditingGroupId(null)
                              deleteGroup.mutate({ id: group.id, name: group.name })
                            }}
                            disabled={deleteGroup.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingGroupId === group.id && (
                          <GroupEditRow
                            initialName={group.name}
                            initialIcon={group.icon}
                            memberRoomIds={group.room_group_members.map((m) => m.room_id)}
                            rooms={rooms}
                            onSave={(n, i, ids) => handleGroupAutoSave(group.id, n, i, ids)}
                            onClose={() => setEditingGroupId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* New group form */}
          <AnimatePresence>
            {showNewGroup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-4 mt-2">
                  <p className="text-sm font-medium">New group</p>

                  {/* Name */}
                  <Input
                    placeholder="e.g. Ground Floor, Wet Rooms…"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setShowNewGroup(false)}
                    autoFocus
                    className="bg-background"
                  />

                  {/* Icon picker */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Icon</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GROUP_ICON_OPTIONS.map((opt) => (
                        <button key={opt.iconName} type="button" title={opt.name}
                          onClick={() => setNewGroupIcon(opt.iconName)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            newGroupIcon === opt.iconName
                              ? "bg-primary/15 ring-2 ring-primary/40 scale-110 text-primary"
                              : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <RoomIcon iconName={opt.iconName} className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Room picker */}
                  {rooms.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Rooms to include</p>
                      <div className="flex flex-wrap gap-2">
                        {rooms.map((room) => {
                          const on = newGroupRooms.has(room.id)
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => {
                                setNewGroupRooms((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(room.id)) next.delete(room.id)
                                  else next.add(room.id)
                                  return next
                                })
                              }}
                              className={[
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition-all duration-150",
                                on ? "border-primary bg-primary/8 text-primary"
                                   : "border-border bg-background hover:bg-muted/60 text-foreground",
                              ].join(" ")}
                            >
                              <RoomIcon iconName={room.icon} className="w-3.5 h-3.5" />
                              {room.name}
                              {on && <Check className="w-3 h-3 ml-0.5" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {newGroupName.trim() && groupNames.has(newGroupName.trim().toLowerCase()) && (
                    <p className="text-xs text-destructive">A group with this name already exists.</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setShowNewGroup(false); setNewGroupName(""); setNewGroupRooms(new Set()) }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddGroup}
                      disabled={
                        !newGroupName.trim() ||
                        groupNames.has(newGroupName.trim().toLowerCase()) ||
                        addGroup.isPending
                      }
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create group
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

    </div>
  )
}
