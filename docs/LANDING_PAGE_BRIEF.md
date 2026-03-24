# Roost — Landing Page Brief

A complete guide to Roost's identity, purpose, features, and voice. Use this as the source of truth for all landing page copy and content decisions.

---

## What is Roost?

Roost is a **shared life dashboard for couples**. It's a macOS desktop app that gives two people one place to manage their home together — shopping, money, chores, calendar, budget — all syncing in real time between both of their Macs.

The name is intentional. A roost is where you come home to. It's warm, shared, and yours.

---

## Who is it for?

Roost is built for **couples who live together** (or are about to). It's not for flatmates, not for families, not for teams. It's for two people building a life under one roof.

It's for the couple who:
- Has a shared grocery list scattered across five different apps
- argues gently about who owes who for the last supermarket run
- forgets whose turn it is to clean the bathroom
- wishes they had one calm, shared place for all of it

---

## The Emotional Core

Managing a home together should feel **joyful and effortless, not like work**. Most household apps are cold, transactional, and built for productivity-obsessed individuals. Roost is the opposite.

The design philosophy is: **warmth over sterility, comfort over corporate, cosiness over clinical.** It's inspired by the video game *Hozy* — the feeling of a well-lived home. Soft, inviting, and human.

Every decision — from the terracotta colour palette to the spring-physics on buttons — reinforces this: this is a tool for people managing *life* together.

The question Roost always asks itself: **Does this feel like home?**

---

## Features

### Dashboard
The home screen. Real-time summary cards for every part of the household, plus a live activity feed showing what both people have been doing. At a glance, both people know the state of their home.

### Shopping
A shared, real-time shopping list. Add items, check them off as you shop, and they update instantly on your partner's screen. Items can be grouped by category. Supports a "next shop" date countdown. Strikethrough animation when items are ticked.

### Expenses
Track shared spending and keep balances fair. Every expense can be split between partners. The app tracks who owes who, with a running balance at all times. The **Settle Up** flow lets you clear the balance with a note — and celebrates with confetti when you're all square. Copy says: "All settled up" not "Balance: £0.00".

### Budget
Per-category spending limits for the month. Visual progress bars show how much of each budget has been used, in traffic-light colours (green → amber → red). Navigate between months to review past spending.

### Chores
Manage household chores with rooms, recurrence, and assignments. Chores can repeat daily, weekly, monthly, or on custom schedules. Organised by room (kitchen, bathroom, living room, etc.). Supports unassigned chores — they float until someone claims them.

**Hazel** (Roost's AI assistant) can suggest chores based on your rooms and household setup. She works silently in the background, normalising data — tidying up spellings, categorising items, keeping things consistent without interrupting you.

### Calendar
A shared household calendar. Pulls in events via webcal:// subscriptions, with live sync status. Aggregates chores and expenses alongside external calendar events so you see everything in one view.

### Notifications
In-app notification panel plus native macOS system notifications. Per-type toggles so you control what pings you. Quiet hours support, including overnight ranges, so the app respects your time.

### DishBoard *(coming soon)*
A feature in development. Details TBC.

---

## Hazel — the AI layer

Hazel is Roost's built-in AI assistant. She's named warmly — not "AI Assistant" or "Smart Features". She works **silently and in the background**, normalising your data: fixing typos on shopping items, categorising expenses, suggesting sensible chore schedules based on your home's rooms.

She doesn't interrupt. She doesn't ask questions. She just quietly keeps things tidy — like someone helpful who lives with you.

When you want her explicitly, there's a **"Suggest chores"** button on the chores screen where she'll generate a sensible starting list based on your home.

---

## Real-time sync

This is the core technical feat of Roost. Both partners' apps stay perfectly in sync via Supabase Realtime. When one person adds a shopping item, it appears on the other's screen immediately. When an expense is logged, the balance updates for both. No refresh needed, no conflicts, no lag.

Two Macs. One home.

---

## Onboarding

New users go through a **12-step guided tour** of the app — a spotlight walks you around each feature with contextual tooltips. It's opt-in, skippable, and designed to feel like a gentle introduction rather than a mandatory tutorial.

---

## Settings & Personalisation

- **Profile:** Name, avatar, personal preferences
- **Household:** Home name, members
- **Rooms:** Customise which rooms exist in your home (used by chores and Hazel)
- **Budget Categories:** Set up what categories matter to your household
- **Notifications:** Granular control per notification type, quiet hours
- **Preferences:** Week start day, time format, date format, currency
- **Account:** Change email/password, secured with OTP step-up authentication
- **Theme:** Light/dark mode toggle (also via `Cmd+Shift+L`), system preference respected on first load

---

## Voice & Tone

Roost speaks warmly. It's conversational, human, and gently encouraging. It never sounds corporate, clinical, or robotic. It acknowledges that this is about real people managing a real home together.

**Examples of the Roost voice:**
- "All settled up" — not "Balance: £0.00"
- "You're owed £24.50" — not "Your balance: +£24.50"
- "Nothing coming up this week" — not "No events scheduled"
- "Let's take a quick tour" — not "Complete onboarding tutorial"

**Principles:**
1. Warm and conversational, never corporate
2. Encouraging, never scolding
3. Clear and direct, never overly cute
4. Human — it's about real people, a real home

---

## Authentication & Access

- Email signup/login
- Google OAuth
- Invite/join flow — one partner creates the household, the other joins via invite
- Account security features including OTP step-up auth for sensitive changes

---

## Platform

Roost is a **macOS desktop app** — a native Electron application. It's not a web app, not a mobile app. It sits in your dock. It sends macOS system notifications. It feels like it belongs on your Mac.

---

## The Origin Story

Roost is a personal project. Thomas built it for himself and his girlfriend as they prepare to move in together in June 2026. It solves real friction they had — the scattered shopping lists, the "who owes who", the forgotten chores. It was built with love, for one specific purpose: making shared home life a little warmer and easier.

---

## Summary

Roost is the app for couples who want their shared life to feel organised without feeling managed. It's warm, real-time, and built for two. The terracotta and cream palette, the soft animations, the gentle copy — all of it says the same thing: **this is your home, and it should feel like it.**
