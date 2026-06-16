/**
 * UserManager OIDC compartilhado (multibackend Modelo B) — usado pelo widget de
 * login (MultibackendLogin) e pela pagina de callback (/auth/callback).
 *
 * client publico PKCE S256 (default do oidc-client-ts); sem client_secret. As APIs
 * de browser (window/localStorage) so sao tocadas na primeira chamada (client-side),
 * mantendo o static export (output: 'export') SSR-safe.
 */
import { getSiteConfig } from '@config'

type UserManagerInstance = import('oidc-client-ts').UserManager

let _umPromise: Promise<UserManagerInstance> | null = null

export function getUserManager(): Promise<UserManagerInstance> {
  if (!_umPromise) {
    _umPromise = (async () => {
      const { UserManager, WebStorageStateStore } = await import('oidc-client-ts')
      const o = getSiteConfig().oidc
      return new UserManager({
        authority: o.authority,
        client_id: o.clientId,
        redirect_uri: o.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        userStore: new WebStorageStateStore({ store: window.localStorage }),
      })
    })()
  }
  return _umPromise
}
