import { app, BrowserWindow, Tray, shell, nativeImage, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc/index'
import { join } from 'path'

// electron-vite sets this env var so we know whether we're in dev or prod
const isDev = process.env.NODE_ENV === 'development'

// Suppress electron-updater's noisy console output
autoUpdater.logger = null
// We control when to download so the user can see the notification first
autoUpdater.autoDownload = false
// We control when to install — user triggers restart explicitly
autoUpdater.autoInstallOnAppQuit = false

// Register roost:// as a custom URL scheme so macOS routes OAuth callbacks back to this app.
// Must be called before app.whenReady().
app.setAsDefaultProtocolClient('roost')

// Hold a reference to the main window so we can send IPC messages to it.
let mainWindow: BrowserWindow | null = null
let menuBarWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Path to the zip downloaded by electron-updater. Captured in update-downloaded so
// the IPC install handler can apply it manually (bypassing Squirrel.Mac, which
// refuses unsigned apps).
let downloadedZipPath: string | null = null

// If a deep link arrives before the window is ready, queue it here.
let pendingDeepLink: string | null = null

function getPackagedResourcePath(fileName: string): string {
  return isDev ? join(process.cwd(), 'resources', fileName) : join(process.resourcesPath, fileName)
}

function getAppIcon(): Electron.NativeImage {
  const icon = nativeImage.createFromPath(getPackagedResourcePath('Icon.icns'))
  return icon.isEmpty() ? nativeImage.createEmpty() : icon
}

// Send a deep link URL to the renderer when it's ready.
function handleDeepLink(url: string): void {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('auth:callback', url)
    // Bring the app window to the foreground after the OAuth redirect
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    app.focus({ steal: true })
  } else {
    pendingDeepLink = url
  }
}

// macOS: the app is already running and receives a deep link via open-url.
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// Wire up all autoUpdater events — each sends an updater:status IPC message to the renderer.
autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('updater:status', { status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('updater:status', { status: 'available', version: info.version })
})

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('updater:status', { status: 'not-available' })
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('updater:status', {
    status: 'downloading',
    percent: Math.round(progress.percent),
  })
})

autoUpdater.on('update-downloaded', (info) => {
  downloadedZipPath = (info as any).downloadedFile ?? null
  mainWindow?.webContents.send('updater:status', { status: 'downloaded', version: info.version })
})

autoUpdater.on('error', (err) => {
  console.error('[autoUpdater] error:', err)
  mainWindow?.webContents.send('updater:status', { status: 'error' })
})

// Check for updates — skips in dev mode, wraps in try/catch to avoid crashes.
function checkForUpdates(): void {
  if (isDev) return
  try {
    autoUpdater.checkForUpdates()
  } catch (err) {
    console.error('[autoUpdater] checkForUpdates failed:', err)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Roost',
    icon: getAppIcon(),
    // macOS-style title bar — hides the default title bar chrome
    // so the window looks clean and native
    titleBarStyle: 'hiddenInset',
    show: false, // Don't flash a blank window before content loads
    webPreferences: {
      // Security: preload runs in a sandboxed context, separate from Node.js
      preload: join(__dirname, '../preload/index.js'),
      // Never allow direct Node.js access from the renderer — use IPC instead
      nodeIntegration: false,
      // Context isolation ensures the preload script runs in its own JS context
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Show the window once the content is ready to avoid a white flash
  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // If a deep link arrived before the renderer was ready, send it now.
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      mainWindow!.webContents.send('auth:callback', pendingDeepLink)
      pendingDeepLink = null
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in the system browser, not inside the app.
  // This is also what makes window.open(oauthUrl) open in Chrome/Safari.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Check for updates 5s after the window is ready, then repeat every hour.
  setTimeout(() => checkForUpdates(), 5000)
  setInterval(() => checkForUpdates(), 60 * 60 * 1000)

  if (isDev) {
    // In dev, electron-vite runs a local Vite server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // In production, load the compiled HTML file
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createMenuBarWindow(): void {
  menuBarWindow = new BrowserWindow({
    width: 400,
    height: 520,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    movable: false,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  menuBarWindow.on('blur', () => {
    menuBarWindow?.hide()
  })

  if (isDev) {
    menuBarWindow.loadURL('http://localhost:5173/menubar.html')
  } else {
    menuBarWindow.loadFile(join(__dirname, '../renderer/menubar.html'))
  }
}

function toggleMenuBarWindow(): void {
  if (!tray || !menuBarWindow) return

  if (menuBarWindow.isVisible()) {
    menuBarWindow.hide()
    return
  }

  const trayBounds = tray.getBounds()
  const windowBounds = menuBarWindow.getBounds()
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  const y = Math.round(trayBounds.y + trayBounds.height + 8)
  menuBarWindow.setPosition(x, y, false)
  menuBarWindow.show()
  menuBarWindow.focus()
}

function createTrayImage() {
  const image = getAppIcon().resize({ width: 18, height: 18 })
  image.setTemplateImage(false)
  return image
}

function createTray(): void {
  const image = createTrayImage()
  tray = new Tray(image)
  tray.setToolTip('Roost')
  // Strong fallback for development: title text makes the status item visible
  // even if the icon fails to render as expected.
  tray.setTitle('Roost')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Roost', click: () => mainWindow?.show() },
      { label: 'Open Menu Bar Panel', click: () => toggleMenuBarWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
  tray.on('click', () => toggleMenuBarWindow())
  console.log('[Roost] tray created')
}

// macOS: keep the app running even when all windows are closed
// (standard macOS behaviour — app lives in the dock until Cmd+Q)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS: re-create the window when the dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const dockIcon = getAppIcon()
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    }
  }

  registerIpcHandlers(() => downloadedZipPath)
  createWindow()
  createMenuBarWindow()
  createTray()
})
