export function isViewRoute() {
  return window.location.pathname === '/view' || window.location.pathname.startsWith('/s/')
}
