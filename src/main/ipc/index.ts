// IPC handlers for main ↔ renderer communication.
// The renderer calls these via window.api (defined in preload/index.ts).

import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import { spawn } from 'child_process'
import { autoUpdater } from 'electron-updater'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { getBudgetInsightsForNest, normalizeExpenseForNest, normalizeText, suggestChores } from '../claude'
import { formatAmount, getStripeClient, getStripePriceIds, isStripePriceId, resolveStripePlan } from '../stripe'


export function registerIpcHandlers(getZipPath: () => string | null): void {
  // Show a native macOS notification.
  // Called by the renderer when a new notification arrives via realtime.
  ipcMain.handle('notify', (_event, { title, body }: { title: string; body?: string }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body: body ?? '' }).show()
    }
  })

  // Normalize user input text via Claude. Falls back to original text on any error.
  // Optional categories array is passed for expense context so Hazel uses the
  // household's actual categories rather than a hardcoded list.
  ipcMain.handle('normalize', (_event, text: string, context: string, categories?: string[]) =>
    normalizeText(text, context, categories).catch(() => ({ text }))
  )

  ipcMain.handle(
    'hazel:categorize-expense',
    (_event, payload: { text: string; categories?: string[]; isNest: boolean }) =>
      normalizeExpenseForNest(payload.text, payload.categories, payload.isNest).catch(() => ({ success: false, reason: 'api_error' as const }))
  )

  // Generate chore suggestions for the household.
  // Accepts existing chore titles to avoid duplicates and the current month for seasonal context.
  // Returns an array of up to 5 suggestion strings, or [] on any error.
  ipcMain.handle('chore:suggest', (_event, existingChores: string[], month: string) =>
    suggestChores(existingChores, month).catch(() => [])
  )

  ipcMain.handle('budget:insights', (_event, payload: { input: unknown; isNest: boolean }) =>
    getBudgetInsightsForNest(payload.input as any, payload.isNest).catch(() => ({ success: false, reason: 'api_error' as const }))
  )

  ipcMain.handle(
    'stripe:create-checkout-session',
    async (
      _event,
      payload: { priceId: string; homeId: string; customerEmail: string; stripeCustomerId?: string; hasUsedTrial?: boolean }
    ) => {
      const stripe = getStripeClient()
      const plan = resolveStripePlan(payload.priceId)
      const lineItem = isStripePriceId(payload.priceId)
        ? { price: payload.priceId, quantity: 1 }
        : {
            price_data: {
              currency: 'gbp',
              unit_amount: plan.unitAmount,
              recurring: { interval: plan.interval },
              product_data: {
                name: `Roost Nest (${plan.label === 'annual' ? 'Annual' : 'Monthly'})`,
              },
            },
            quantity: 1,
          }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [lineItem],
        customer: payload.stripeCustomerId || undefined,
        customer_email: payload.stripeCustomerId ? undefined : payload.customerEmail,
        success_url: 'roost://subscription/success',
        cancel_url: 'roost://subscription/cancel',
        allow_promotion_codes: true,
        metadata: { home_id: payload.homeId },
        subscription_data: {
          metadata: { home_id: payload.homeId },
          ...(payload.hasUsedTrial ? {} : { trial_period_days: 14 }),
        },
      })

      if (!session.url) throw new Error('Stripe checkout session did not return a URL')
      return { url: session.url }
    }
  )

  ipcMain.handle('stripe:create-portal-session', async (_event, payload: { stripeCustomerId: string }) => {
    const stripe = getStripeClient()
    const session = await stripe.billingPortal.sessions.create({
      customer: payload.stripeCustomerId,
      return_url: 'roost://subscription/success',
    })
    return { url: session.url }
  })

  ipcMain.handle('stripe:get-prices', async () => {
    const ids = getStripePriceIds()
    const hasRealIds = isStripePriceId(ids.monthly) && isStripePriceId(ids.annual)

    if (!hasRealIds) {
      return {
        monthly: {
          id: ids.monthly || 'monthly',
          unitAmount: 499,
          currency: 'gbp',
          interval: 'month',
          formattedAmount: '£4.99',
          trialDays: 14,
        },
        annual: {
          id: ids.annual || 'annual',
          unitAmount: 3999,
          currency: 'gbp',
          interval: 'year',
          formattedAmount: '£39.99',
          trialDays: 14,
        },
      }
    }

    const stripe = getStripeClient()

    const [monthly, annual] = await Promise.all([
      stripe.prices.retrieve(ids.monthly),
      stripe.prices.retrieve(ids.annual),
    ])

    return {
      monthly: {
        id: monthly.id,
        unitAmount: monthly.unit_amount ?? 0,
        currency: monthly.currency,
        interval: monthly.recurring?.interval ?? 'month',
        formattedAmount: formatAmount(monthly.unit_amount, monthly.currency),
        trialDays: 14,
      },
      annual: {
        id: annual.id,
        unitAmount: annual.unit_amount ?? 0,
        currency: annual.currency,
        interval: annual.recurring?.interval ?? 'year',
        formattedAmount: formatAmount(annual.unit_amount, annual.currency),
        trialDays: 14,
      },
    }
  })

  // Write a ready-made .ics string to a temp file and open it in the default calendar app.
  // The renderer builds the ICS content; this handler only does file I/O + shell open.
  // Returns { error: string } on failure, undefined on success.
  ipcMain.handle('export-calendar', async (_event, icsContent: string) => {
    try {
      const filePath = join(tmpdir(), 'roost-calendar.ics')
      writeFileSync(filePath, icsContent, 'utf-8')
      // shell.openPath resolves to a non-empty error string on failure, empty string on success
      const errMsg = await shell.openPath(filePath)
      if (errMsg) {
        console.error('[export-calendar] shell.openPath failed:', errMsg)
        return { error: errMsg }
      }
      return { success: true }
    } catch (err) {
      console.error('[export-calendar] failed:', err)
      return { error: String(err) }
    }
  })

  // Open a URL in the system default browser / registered protocol handler.
  // Used to open webcal:// subscription URLs in Apple Calendar.
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
    } catch (err) {
      console.error('[open-external] failed:', err)
      return { error: String(err) }
    }
  })

  ipcMain.handle('open-main-window', () => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
        return
      }
    }
  })

  // Trigger an update check manually from the renderer.
  // Only runs in production (packaged app) — no-op in dev.
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) return
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      console.error('[updater:check] failed:', err)
    }
  })

  // Start downloading the available update.
  ipcMain.handle('updater:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
    } catch (err) {
      console.error('[updater:download] failed:', err)
    }
  })

  // Quit and install the downloaded update.
  // electron-updater on macOS delegates to Squirrel.Mac which refuses unsigned
  // apps. We bypass it: grab the zip electron-updater already downloaded, spawn
  // a detached shell script that extracts it after we quit, strips the quarantine
  // attribute (so Gatekeeper doesn't block relaunch), then opens the new bundle.
  ipcMain.handle('updater:install', () => {
    const zipPath = getZipPath()
    const dotApp = process.execPath.indexOf('.app')

    if (zipPath && dotApp !== -1) {
      const appBundlePath = process.execPath.substring(0, dotApp + 4)
      const appDir = dirname(appBundlePath)
      const script = [
        '#!/bin/bash',
        'sleep 3',
        `rm -rf "${appBundlePath}"`,
        `unzip -oq "${zipPath}" -d "${appDir}"`,
        `xattr -rd com.apple.quarantine "${appBundlePath}" 2>/dev/null || true`,
        `open "${appBundlePath}"`,
      ].join('\n')
      const scriptPath = join(tmpdir(), 'roost-update.sh')
      writeFileSync(scriptPath, script, { mode: 0o755 })
      spawn('sh', [scriptPath], { detached: true, stdio: 'ignore' }).unref()
      app.quit()
    } else {
      // Fallback for non-macOS or missing zip path
      setImmediate(() => autoUpdater.quitAndInstall(true, true))
    }
  })
}
