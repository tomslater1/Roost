import { useMemo, useState } from 'react'
import { formatDistanceToNow, isAfter } from 'date-fns'
import {
  Pin, Plus, Trash2, Clock3, Infinity as InfinityIcon, Link2, CalendarDays,
  Sparkles, Home, Receipt, CheckSquare, ShoppingCart, PiggyBank, Filter,
  Eye, Bell, BellOff, User, Users, CheckCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AnimatedPage } from '../components/AnimatedPage'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { DatePicker } from '../components/ui/DatePicker'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Switch } from '../components/ui/switch'
import { EmptyState } from '../components/EmptyState'
import { usePinboard } from '../hooks/usePinboard'
import { useHome } from '../hooks/useHome'
import { useRooms } from '../hooks/useRooms'
import { useChores } from '../hooks/useChores'
import { useExpenses } from '../hooks/useExpenses'
import { useBudget } from '../hooks/useBudget'
import { useShoppingList } from '../hooks/useShoppingList'
import { CategoryIcon } from '../components/CategoryIcon'
import { RoomIcon } from '../components/RoomIcon'
import { mergeCategories } from '../lib/categories'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { customCategorySchema } from '@/lib/schemas/budgets'

const LINK_META = {
  room: { label: 'Room', icon: Home },
  category: { label: 'Category', icon: PiggyBank },
  chore: { label: 'Chore', icon: CheckSquare },
  expense: { label: 'Expense', icon: Receipt },
  shopping: { label: 'Shopping', icon: ShoppingCart },
  budget: { label: 'Budget', icon: PiggyBank },
  calendar: { label: 'Calendar', icon: CalendarDays },
} as const

type LinkType = keyof typeof LINK_META | 'none'
type RecipientType = 'self' | 'partner' | 'everyone'

export function Pinboard() {
  const { notes, isLoading, addNote, deleteNote, acknowledgeNote, isAdding } = usePinboard()
  const { members, home } = useHome()
  const { rooms } = useRooms()
  const { chores } = useChores()
  const { expenses } = useExpenses()
  const { summary } = useBudget({ expenses })
  const { items: shoppingItems } = useShoppingList()

  const customCatsQuery = useQuery({
    queryKey: ['custom-categories', home?.id],
    enabled: !!home?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_custom_categories')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return z.array(customCategorySchema).parse(data)
    },
  })

  const allCategories = mergeCategories(customCatsQuery.data ?? [])

  const [content, setContent] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('none')
  const [selectedLink, setSelectedLink] = useState<string>('none')
  const [expiryDate, setExpiryDate] = useState<Date | undefined>()
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'expiring' | 'permanent'>('active')
  const [composerOpen, setComposerOpen] = useState(false)
  const [recipientType, setRecipientType] = useState<RecipientType>('everyone')
  const [notifyOnCreate, setNotifyOnCreate] = useState(true)

  const currentMember = members[0] ? members.find((m) => m.user_id === notes[0]?.author_id) : undefined
  const me = members.length ? members.find((m) => m.user_id !== undefined && m.user_id === members.find((x) => x.user_id)?.user_id) : undefined
  const partner = members.find((m, _i) => m.user_id !== me?.user_id)

  const linkOptions = useMemo(() => {
    switch (linkType) {
      case 'room':
        return rooms.map((room) => ({
          value: room.id,
          label: room.name,
          icon: <RoomIcon iconName={room.icon} className="w-3.5 h-3.5" />,
        }))
      case 'category':
        return allCategories.map((category) => ({
          value: category.name,
          label: category.name,
          icon: <CategoryIcon category={category} className="w-3.5 h-3.5" />,
        }))
      case 'chore':
        return chores.map((chore) => ({ value: chore.id, label: chore.title }))
      case 'expense':
        return expenses.slice(0, 20).map((expense) => ({ value: expense.id, label: expense.title }))
      case 'shopping':
        return shoppingItems.slice(0, 20).map((item) => ({ value: item.id, label: item.name }))
      case 'budget':
        return (summary?.budgeted ?? []).map((budget) => ({
          value: budget.budgetId ?? budget.category.name,
          label: budget.category.name,
        }))
      case 'calendar':
        return [{ value: 'calendar-overview', label: 'Calendar overview' }]
      default:
        return []
    }
  }, [linkType, rooms, allCategories, chores, expenses, shoppingItems, summary])

  const activeNotes = useMemo(() => {
    const now = new Date()
    return notes.filter((note) => !note.expires_at || isAfter(new Date(note.expires_at), now))
  }, [notes])

  const notesForMe = useMemo(
    () => activeNotes.filter((note) => note.target_scope === 'everyone' || note.target_scope === 'self' || note.target_user_id === me?.user_id),
    [activeNotes, me?.user_id]
  )

  const filteredNotes = activeNotes.filter((note) => {
    const expiringSoon = !!note.expires_at && (new Date(note.expires_at).getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000
    switch (viewFilter) {
      case 'active': return true
      case 'expiring': return expiringSoon
      case 'permanent': return !note.expires_at
      default: return true
    }
  })

  const expiringCount = activeNotes.filter((note) => note.expires_at && (new Date(note.expires_at).getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000).length
  const permanentCount = activeNotes.filter((note) => !note.expires_at).length
  const unseenCount = notesForMe.filter((note) => !note.pinboard_note_acknowledgements.some((ack) => ack.user_id === me?.user_id)).length

  const handleCreate = () => {
    const selected = linkOptions.find((option) => option.value === selectedLink)
    addNote.mutate({
      content,
      link_type: linkType === 'none' ? undefined : linkType,
      linked_entity_id: linkType === 'category' || linkType === 'calendar' ? undefined : (selectedLink !== 'none' ? selectedLink : undefined),
      link_label: selected?.label,
      target_scope: recipientType,
      target_user_id: recipientType === 'partner' ? partner?.user_id : recipientType === 'self' ? me?.user_id : undefined,
      notify_on_create: notifyOnCreate,
      expires_at: expiryDate ? expiryDate.toISOString() : null,
    })
    setContent('')
    setLinkType('none')
    setSelectedLink('none')
    setExpiryDate(undefined)
    setRecipientType('everyone')
    setNotifyOnCreate(true)
    setComposerOpen(false)
  }

  const authorMeta = (authorId?: string | null) => {
    const member = members.find((m) => m.user_id === authorId)
    return {
      name: member?.display_name ?? 'Someone',
      color: member?.avatar_color ?? '#9db19f',
    }
  }

  const recipientLabel = (targetScope: RecipientType, targetUserId?: string | null) => {
    if (targetScope === 'everyone') return 'For everyone'
    if (targetScope === 'self') return 'For me'
    const target = members.find((m) => m.user_id === targetUserId)
    return `For ${target?.display_name ?? 'partner'}`
  }

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Pinboard</h1>
          <p className="text-muted-foreground max-w-2xl">
            A warm little shared board for reminders, nudges, and notes you want sitting in the home all week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Pin className="w-3.5 h-3.5" />
            {activeNotes.length} live {activeNotes.length === 1 ? 'note' : 'notes'}
          </Badge>
          {unseenCount > 0 && (
            <Badge className="gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
              <Eye className="w-3.5 h-3.5" />
              {unseenCount} unseen
            </Badge>
          )}
          <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Pin a new note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-3">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Leave a reminder, a little nudge, or something one of you shouldn't forget…"
                      className="min-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Keep it simple and human — like a real note pinned in the kitchen.
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link it to</label>
                    <Select value={linkType} onValueChange={(value) => { setLinkType(value as LinkType); setSelectedLink('none') }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional context" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nothing specific</SelectItem>
                        <SelectItem value="room">A room</SelectItem>
                        <SelectItem value="category">A category</SelectItem>
                        <SelectItem value="chore">A chore</SelectItem>
                        <SelectItem value="expense">An expense</SelectItem>
                        <SelectItem value="shopping">A shopping item</SelectItem>
                        <SelectItem value="budget">A budget</SelectItem>
                        <SelectItem value="calendar">The calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stay up until</label>
                    <DatePicker
                      value={expiryDate}
                      onChange={setExpiryDate}
                      placeholder="Leave up permanently"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Who is this for?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'self', label: 'You', icon: User },
                        { value: 'partner', label: partner?.display_name ?? 'Partner', icon: Pin },
                        { value: 'everyone', label: 'Everyone', icon: Users },
                      ] as const).map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRecipientType(value)}
                          className={[
                            'rounded-xl border px-3 py-2.5 text-sm flex flex-col items-center gap-1.5 transition-colors',
                            recipientType === value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground',
                          ].join(' ')}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-center leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notification</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNotifyOnCreate(true)}
                        className={[
                          'rounded-xl border px-3 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors',
                          notifyOnCreate
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        <Bell className="w-4 h-4" />
                        Notify
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifyOnCreate(false)}
                        className={[
                          'rounded-xl border px-3 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors',
                          !notifyOnCreate
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        <BellOff className="w-4 h-4" />
                        Silent
                      </button>
                    </div>
                  </div>
                </div>

                {linkType !== 'none' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose what it points to</label>
                    <Select value={selectedLink} onValueChange={setSelectedLink}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick something from the app" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    {expiryDate ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning">
                        <Clock3 className="w-3 h-3" />
                        Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 text-secondary-foreground">
                        <InfinityIcon className="w-3 h-3" />
                        Permanent note
                      </span>
                    )}
                    {linkType !== 'none' && selectedLink !== 'none' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        <Link2 className="w-3 h-3" />
                        Linked note
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {recipientType === 'everyone' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {recipientType === 'self' ? 'For you' : recipientType === 'partner' ? `For ${partner?.display_name ?? 'partner'}` : 'For everyone'}
                    </span>
                  </div>

                  <Button onClick={handleCreate} disabled={!content.trim() || isAdding} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {isAdding ? 'Pinning…' : 'Pin note'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-primary/15 bg-gradient-to-r from-card via-card to-accent/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { label: 'Live', value: activeNotes.length, tone: 'bg-primary/10 text-primary border-primary/20' },
                { label: 'Permanent', value: permanentCount, tone: 'bg-secondary/20 text-secondary-foreground border-secondary/20' },
                { label: 'Needs eyes', value: unseenCount, tone: 'bg-warning/10 text-warning border-warning/20' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl border p-3 ${stat.tone}`}>
                  <p className="text-xs font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 mr-1 text-sm text-muted-foreground">
                <Filter className="w-4 h-4 text-primary" />
                Show
              </div>
              {([
                ['active', 'All active'],
                ['permanent', 'Permanent'],
                ['expiring', 'Expiring soon'],
                ['all', 'Show all'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setViewFilter(value)}
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    viewFilter === value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background/70 border-border text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Pinned notes</h3>
              <p className="text-sm text-muted-foreground mt-1">Small reminders that stay visible for both of you.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState
              icon={Pin}
              title="Nothing on the board just now"
              description="Pin your first note above and it will appear here for both of you straight away."
            />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note, index) => {
                  const author = authorMeta(note.author_id)
                  const linkMeta = note.link_type ? LINK_META[note.link_type] : null
                  const Icon = linkMeta?.icon
                  const expiringSoon = !!note.expires_at && (new Date(note.expires_at).getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000
                  const seenByMe = note.pinboard_note_acknowledgements.some((ack) => ack.user_id === me?.user_id)
                  const seenCount = note.pinboard_note_acknowledgements.length

                  return (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.22, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Card className="h-full bg-gradient-to-br from-card via-card to-accent/20 border-border/70 hover:border-primary/25 transition-colors">
                        <CardContent className="p-5 h-full flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: author.color }} />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{author.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Pinned {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteNote.mutate({ id: note.id, content: note.content })}>
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>

                          <p className="text-[15px] leading-6 flex-1 whitespace-pre-wrap">{note.content}</p>

                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              {note.target_scope === 'everyone' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {recipientLabel(note.target_scope, note.target_user_id)}
                            </span>
                            {linkMeta && Icon && note.link_label && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Icon className="w-3 h-3" />
                                {note.link_label}
                              </span>
                            )}
                            {note.expires_at ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${expiringSoon ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                                <Clock3 className="w-3 h-3" />
                                {expiringSoon ? 'Expires ' : 'Up until '}
                                {formatDistanceToNow(new Date(note.expires_at), { addSuffix: true })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-medium">
                                <InfinityIcon className="w-3 h-3" />
                                Permanent
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${seenByMe ? 'bg-success/15 text-success' : 'bg-warning/10 text-warning'}`}>
                              {seenByMe ? <CheckCheck className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {seenByMe ? 'Seen by you' : 'Needs your eyes'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-4">
                            <p className="text-xs text-muted-foreground">
                              Seen by {seenCount} {seenCount === 1 ? 'person' : 'people'}
                            </p>
                            {!seenByMe && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => acknowledgeNote.mutate({ noteId: note.id })}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Mark as seen
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
