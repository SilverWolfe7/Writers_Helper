/**
 * Writer's Helper — Electron main process.
 *
 * Loads the deployed Writer's Helper web app in a native browser window with
 * automatic microphone permission for our origin and external links opened
 * in the user's default browser. Auto-updates via electron-updater.
 */
const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const APP_URL =
  process.env.WRITERS_HELPER_URL ||
  "https://voice-notes-writer-1.preview.emergentagent.com/";

const APP_ORIGIN = (() => {
  try {
    return new URL(APP_URL).origin;
  } catch {
    return APP_URL;
  }
})();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#FAF9F5",
    title: "Writer's Helper",
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Auto-grant microphone + speech-recognition for our origin only.
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const requestOrigin = details?.requestingUrl
        ? new URL(details.requestingUrl).origin
        : APP_ORIGIN;
      const isOurOrigin = requestOrigin === APP_ORIGIN;
      const allowed = ["media", "audioCapture", "microphone"];
      callback(isOurOrigin && allowed.includes(permission));
    }
  );

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) => {
      const allowed = ["media", "audioCapture", "microphone"];
      return requestingOrigin === APP_ORIGIN && allowed.includes(permission);
    }
  );

  // Open external links (anything outside our origin) in the OS browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_ORIGIN)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Block in-window navigation away from our app.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [
          {
            label: "Writer's Helper",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow && mainWindow.webContents.reload(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        ...(process.env.ELECTRON_IS_DEV
          ? [{ type: "separator" }, { role: "toggleDevTools" }]
          : []),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Manage microphone access",
          click: () =>
            mainWindow && mainWindow.loadURL(`${APP_ORIGIN}/setup`),
        },
        { type: "separator" },
        {
          label: "Check for updates…",
          click: () => checkForUpdatesManually(),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.setName("Writer's Helper");

// ----- Auto-update -----
let manualUpdateCheck = false;

function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on("error", (err) => {
    console.error("[updater] error:", err?.message || err);
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Update check failed",
        message: "Couldn't check for updates right now.",
        detail: String(err?.message || err),
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "You're up to date",
        message: `Writer's Helper ${app.getVersion()} is the latest version.`,
      });
    }
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[updater] update available:", info?.version);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    manualUpdateCheck = false;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update ready",
      message: `Writer's Helper ${info?.version} has been downloaded.`,
      detail: "Restart now to apply the update.",
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
}

function checkForUpdatesManually() {
  if (!app.isPackaged) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update check unavailable",
      message: "Auto-update only runs in packaged builds.",
      detail: "Run yarn package to produce a release binary.",
    });
    return;
  }
  manualUpdateCheck = true;
  autoUpdater.checkForUpdates().catch((err) => console.error("[updater] manual check failed:", err));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  configureAutoUpdater();
  if (app.isPackaged) {
    autoUpdater
      .checkForUpdatesAndNotify()
      .catch((err) => console.error("[updater] startup check failed:", err));
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
