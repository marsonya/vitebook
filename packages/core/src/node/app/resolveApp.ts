import type { CLIArgs } from '../cli/args.js';
import { loadModule } from '../utils/module.js';
import { resolveRelativePath } from '../utils/path.js';
import type { App } from './App.js';
import type { AppConfig } from './AppOptions.js';
import { createApp } from './create/createApp.js';
import { resolveConfigPath } from './create/resolveConfigPath.js';

export async function resolveApp(
  args: CLIArgs = { '--': [], command: 'dev' },
  appConfig?: AppConfig
): Promise<App> {
  const config = appConfig ?? (await resolveUserAppConfig(args));
  return createApp(
    {
      ...config,
      cliArgs: args,
      root: args.root ?? config.root,
      srcDir: args.srcDir ?? config.srcDir,
      publicDir: args.publicDir ?? config.publicDir,
      cacheDir: args.cacheDir ?? config.cacheDir,
      configDir: args.configDir ?? config.configDir,
      include: args.include ?? config.include,
      debug: args.debug ?? config.debug,
      ...{
        site: {
          ...(config.site ?? {}),
          baseUrl: args.baseUrl ?? config.site?.baseUrl
        },
        vite: {
          ...(config.vite ?? {}),
          cacheDir: args.cacheDir ?? config.vite?.cacheDir ?? config.cacheDir,
          publicDir:
            args.publicDir ?? config.vite?.publicDir ?? config.publicDir,
          clearScreen: args.clearScreen ?? config.vite?.clearScreen ?? false,
          mode: args.mode ?? config.vite?.mode,
          server: {
            ...(config.vite?.server ?? {}),
            https: args.https ?? config.vite?.server?.https,
            host: args.host ?? config.vite?.server?.host,
            port: args.port ?? config.vite?.server?.port,
            cors: args.cors ?? config.vite?.server?.cors,
            strictPort: args.strictPort ?? config.vite?.server?.strictPort,
            open: args.open ?? config.vite?.server?.open,
            fs: {
              // TODO: remove this and replace with `allow`.
              strict: false
            }
          },
          build: {
            ...(config.vite?.build ?? {}),
            target: args.target ?? config.vite?.build?.target,
            outDir: args.outDir ?? config.vite?.build?.outDir,
            emptyOutDir: args.emptyOutDir ?? config.vite?.build?.emptyOutDir,
            assetsDir: args.assetsDir ?? config.vite?.build?.assetsDir,
            assetsInlineLimit:
              args.assetsInlineLimit ?? config.vite?.build?.assetsInlineLimit,
            sourcemap: args.sourcemap ?? config.vite?.build?.sourcemap,
            minify: args.minify ?? config.vite?.build?.minify
          }
        }
      }
    },
    {
      command: args.command === 'build' ? 'build' : 'serve',
      mode: args.mode ?? config.vite?.mode,
      isDev: args.mode ? args.mode === 'development' : args.command === 'dev'
    }
  );
}

export async function resolveUserAppConfig(args: CLIArgs): Promise<AppConfig> {
  const root = resolveRelativePath(process.cwd(), args.root ?? '');
  const configDir = resolveRelativePath(root, args.configDir ?? '.vitebook');
  const configPath = resolveConfigPath(configDir);
  const tmpDir = resolveRelativePath(configDir, args.tmpDir ?? '.temp');
  return configPath
    ? (await loadModule<{ default: AppConfig }>(configPath, { outdir: tmpDir }))
        .default ?? {}
    : {};
}
