let container: HTMLElement | null = null

export function setScrollContainer(el: HTMLElement | null) {
  container = el
}

export function scrollToTop() {
  container?.scrollTo(0, 0)
}
