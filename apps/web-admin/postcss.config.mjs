/**
 * `web-admin` does not use Tailwind.
 *
 * The monorepo root has a Tailwind PostCSS config, which breaks `web-admin` builds
 * when only `apps/web-admin` dependencies are installed (e.g. `npm ci` in this folder).
 *
 * Keeping a local PostCSS config here makes the static export self-contained.
 */
export default {
  plugins: {},
};

