# Notely

Notely is a simple Markdown note taking application. Each users notepad is stored in their browser's localstorage.
Each user gets a single note, to encourage people to organize all their information on a single page.

## Important Notes

Because of its real time markdown rendering abilities, Notely is forced to re-implement text input manually using content-editable elements and keydown event listeners. You may encounter text entry bugs, please report them.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
npm run build
```

> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.
