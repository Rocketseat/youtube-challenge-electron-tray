const { resolve, basename } = require('path');
const {
  app, Menu, Tray, dialog,
} = require('electron');
const { spawn } = require('child_process');
const Store = require('electron-store');
const Sentry = require('@sentry/electron');

Sentry.init({ dsn: 'https://18c9943a576d41248b195b5678f2724e@sentry.io/1506479' });

const schema = {
  projects: {
    type: 'string',
  },
};

const store = new Store({ schema });

app.dock.hide();

function render(tray) {
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];

  const items = projects.map(project => ({
    label: project.name,
    submenu: [
      {
        label: 'Abrir no VSCode',
        click: () => {
          spawn('code', [project.path], {
            cwd: process.cwd(),
            env: {
              PATH: process.env.PATH,
            },
            stdio: 'inherit',
          });
        },
      },
      {
        label: 'Remover',
        click: () => {
          store.set(
            'projects',
            JSON.stringify(projects.filter(item => item.path !== project.path)),
          );

          render(tray);
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Adicionar novo projeto...',
      click: () => {
        const result = dialog.showOpenDialog({ properties: ['openDirectory'] });

        if (!result) return;

        const [path] = result;
        const name = basename(path);

        store.set(
          'projects',
          JSON.stringify([
            ...projects,
            {
              path,
              name,
            },
          ]),
        );

        render(tray);
      },
    },
    {
      type: 'separator',
    },
    ...items,
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: 'Fechar Code Tray',
      role: 'quit',
      enabled: true,
    },
  ]);

  tray.setContextMenu(contextMenu);
}

app.on('ready', () => {
  const tray = new Tray(resolve(__dirname, 'assets', 'iconTemplate.png'));

  render(tray);
});
