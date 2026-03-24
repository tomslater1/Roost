// IPC handlers for main ↔ renderer communication.
// The renderer calls these via window.api (defined in preload/index.ts).

import { app, ipcMain, Notification, shell } from 'electron'
import { spawn } from 'child_process'
import { autoUpdater } from 'electron-updater'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { normalizeText, suggestChores } from '../claude'


export function registerIpcHandlers(): void {
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

  // Generate chore suggestions for the household.
  // Accepts existing chore titles to avoid duplicates and the current month for seasonal context.
  // Returns an array of up to 5 suggestion strings, or [] on any error.
  ipcMain.handle('chore:suggest', (_event, existingChores: string[], month: string) =>
    suggestChores(existingChores, month).catch(() => [])
  )

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
  // isSilent=true skips any native install dialog (required for unsigned macOS apps).
  // isForceRunAfter=true relaunches the app after install.
  ipcMain.handle('updater:install', () => {
    setImmediate(() => {
      // electron-updater's built-in relaunch (app.relaunch) doesn't work for
      // unsigned macOS apps — the new binary is quarantined by Gatekeeper.
      // Instead, spawn a detached `open` command that fires after the install
      // completes, which macOS handles correctly for unsigned apps.
      const dotApp = process.execPath.indexOf('.app')
      if (dotApp !== -1) {
        const appPath = process.execPath.substring(0, dotApp + 4)
        spawn('sh', ['-c', `sleep 3 && open "${appPath}"`], {
          detached: true,
          stdio: 'ignore',
        }).unref()
      }
      // isForceRunAfter=false: skip electron-updater's relaunch, we handle it above
      autoUpdater.quitAndInstall(true, false)
    })
  })
}
