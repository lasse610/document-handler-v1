export default function mergeConsecutiveHTMLTags(
  element: HTMLElement | Element,
) {
  const mergeTags = ["STRONG", "SPAN", "I"];

  const tagName = element.tagName;
  if (element.children.length === 0) {
    const nextSibling = element.nextElementSibling;

    const shouldMerge =
      nextSibling?.tagName === tagName &&
      mergeTags.includes(nextSibling.tagName) &&
      nextSibling.children.length === 0;

    if (shouldMerge) {
      const text = element.textContent;
      const nextText = nextSibling.textContent;
      if (text && nextText) {
        const newText = text + nextText;
        element.textContent = newText;
        nextSibling.remove();
        return true;
      }
    }

    return false;
  }
  const child = element.firstElementChild;
  let sibling = child;
  while (sibling) {
    const updated = mergeConsecutiveHTMLTags(sibling);
    if (updated) {
      continue;
    }
    sibling = sibling.nextElementSibling;
  }
}
