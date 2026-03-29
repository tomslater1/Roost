import { useMemo, useState } from 'react'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ShoppingCart, CheckSquare, Pin, Plus, ArrowUpRight, CalendarDays, Circle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuthContext } from '../context/AuthContext'
import { useShoppingList } from '../hooks/useShoppingList'
import { useChores } from '../hooks/useChores'
import { usePinboard } from '../hooks/usePinboard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import appIcon from '../assets/app-icon.png'

type Tab = 'shopping' | 'chores' | 'pins'

export function MenubarWidget() {
  const { session } = useAuthContext()
  const { householdName, shoppingItems, chores, nextShopDate } = useApp()
  const shoppingHook = useShoppingList()
  const choresHook = useChores()
  const pinboardHook = usePinboard()
  const [tab, setTab] = useState<Tab>('shopping')
  const [shoppingDraft, setShoppingDraft] = useState('')
  const [choreDraft, setChoreDraft] = useState('')

  const activeShopping = shoppingItems.filter((item) => !item.checked).slice(0, 6)
  const activeChores = chores.filter((chore) => !chore.completed).slice(0, 6)
  const activePins = pinboardHook.notes.filter((note) => !note.expires_at || new Date(note.expires_at) > new Date()).slice(0, 5)
  const overdueCount = chores.filter((chore) => !chore.completed && chore.dueDate && new Date(chore.dueDate) < new Date()).length

  const nextShopLabel = useMemo(() => {
    if (!nextShopDate) return 'No shop date set'
    try {
      return `Shop ${formatDistanceToNowStrict(parseISO(nextShopDate), { addSuffix: true })}`
    } catch {
      return 'No shop date set'
    }
  }, [nextShopDate])

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground p-3">
        <Card>
          <CardContent className="p-5 text-center space-y-3">
            <img src={appIcon} alt="Roost" className="mx-auto w-10 h-10 rounded-2xl object-cover" />
            <div>
              <p className="font-medium">Open Roost to sign in</p>
              <p className="text-sm text-muted-foreground mt-1">The menu bar widget shows your home once you're signed in.</p>
            </div>
            <Button className="w-full gap-2" onClick={() => window.api.openMainWindow()}>
              <ArrowUpRight className="w-4 h-4" />
              Open Roost
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-3 select-none">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Roost</p>
            <h1 className="font-medium">{householdName}</h1>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => window.api.openMainWindow()}>
            Open app
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-3 gap-3">
            <Snapshot icon={ShoppingCart} label="Shopping" value={String(activeShopping.length)} sub="to buy" />
            <Snapshot icon={CheckSquare} label="Chores" value={String(overdueCount)} sub="overdue" />
            <Snapshot icon={CalendarDays} label="Next shop" value="" sub={nextShopLabel} compact />
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'shopping', label: 'Shopping', icon: ShoppingCart },
            { key: 'chores', label: 'Chores', icon: CheckSquare },
            { key: 'pins', label: 'Pins', icon: Pin },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as Tab)}
              className={[
                'rounded-xl border px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors',
                tab === key ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'shopping' && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={shoppingDraft}
                  onChange={(e) => setShoppingDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shoppingDraft.trim()) {
                      shoppingHook.addItem.mutate({ name: shoppingDraft.trim() })
                      setShoppingDraft('')
                    }
                  }}
                  placeholder="Quick add shopping item"
                  className="h-9"
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (!shoppingDraft.trim()) return
                    shoppingHook.addItem.mutate({ name: shoppingDraft.trim() })
                    setShoppingDraft('')
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {activeShopping.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nothing to pick up right now.</p>
                ) : activeShopping.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => shoppingHook.toggleItem.mutate({ id: item.id, checked: true, name: item.name })}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 text-left"
                  >
                    <Circle className="w-3.5 h-3.5 text-primary/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'chores' && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={choreDraft}
                  onChange={(e) => setChoreDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && choreDraft.trim()) {
                      choresHook.addChore.mutate({ title: choreDraft.trim() })
                      setChoreDraft('')
                    }
                  }}
                  placeholder="Quick add chore"
                  className="h-9"
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (!choreDraft.trim()) return
                    choresHook.addChore.mutate({ title: choreDraft.trim() })
                    setChoreDraft('')
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {activeChores.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No chores waiting right now.</p>
                ) : activeChores.map((chore) => (
                  <button
                    key={chore.id}
                    type="button"
                    onClick={() => choresHook.completeChore.mutate({ id: chore.id, title: chore.title, frequency: chore.frequency, due_date: chore.due_date })}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 text-left"
                  >
                    <Circle className="w-3.5 h-3.5 text-primary/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chore.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{chore.frequency ?? 'One-off'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'pins' && (
          <Card>
            <CardContent className="p-4 space-y-1 max-h-64 overflow-y-auto">
              {activePins.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nothing pinned just now.</p>
              ) : activePins.map((note) => (
                <div key={note.id} className="px-2 py-2 rounded-lg bg-muted/40">
                  <p className="text-sm leading-5">{note.content}</p>
                  {note.link_label && <p className="text-xs text-muted-foreground mt-1">{note.link_label}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Snapshot({ icon: Icon, label, value, sub, compact = false }: { icon: any; label: string; value: string; sub: string; compact?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/35 px-3 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      {!compact && <p className="text-2xl font-semibold leading-none mb-1">{value}</p>}
      <p className={`text-xs ${compact ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{sub}</p>
    </div>
  )
}