import type { Theme as DefaultTheme } from '@vitebook/core/shared';

import type { Router } from '../../client/router/router';
import type { SvelteConstructor } from './SveltePage';

export type ClientTheme = DefaultTheme<SvelteConstructor> & {
  configureRouter?(router: Router): void | Promise<void>;
};

export type VirtualClientThemeModule = {
  default: ClientTheme;
};
