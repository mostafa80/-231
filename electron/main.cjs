const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'برنامج الاستلامات للفروع - SoMuch',
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    show: false,
  });

  // Load the built app index.html
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // If running in development with Vite dev server
    mainWindow.loadURL('http://localhost:3000');
  }

  // Graceful show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Handle external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Custom application menu in Arabic & English
  const menuTemplate = [
    {
      label: 'ملف (File)',
      submenu: [
        {
          label: 'طباعة الإذن أو التقرير (Print)',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow && mainWindow.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'إغلاق البرنامج (Exit)',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'عرض (View)',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل (Reload)' },
        { role: 'forceReload', label: 'إعادة تحميل قسرية' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'حجم عادي (100%)' },
        { role: 'zoomIn', label: 'تكبير الشاشة (+)' },
        { role: 'zoomOut', label: 'تصغير الشاشة (-)' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة (F11)' },
      ],
    },
    {
      label: 'مساعدة (Help)',
      submenu: [
        {
          label: 'أدوات المطورين (DevTools)',
          accelerator: 'F12',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools(),
        },
        {
          label: 'عن برنامج الاستلامات',
          click: () => {
            shell.openExternal('https://github.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
