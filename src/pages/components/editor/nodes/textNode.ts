import {
  type EditorConfig,
  type NodeKey,
  TextNode,
  type SerializedTextNode,
  isHTMLElement,
  type LexicalEditor,
  type DOMExportOutput,
} from "lexical";

export class CustomTextNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return "custom-text";
  }

  static clone(node: CustomTextNode): CustomTextNode {
    return new CustomTextNode(node.__text);
  }

  static importJSON(serializedNode: SerializedTextNode) {
    const node = super.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedTextNode {
    const node = super.exportJSON();
    return node;
  }

  public override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = super.createDOM(editor._config);

    if (!(element !== null && isHTMLElement(element))) {
      throw Error(`Expected TextNode createDOM to always return a HTMLElement`);
    }

    //element.style.whiteSpace = "pre-wrap"; // This is the only way to properly add support for most clients,
    // even if it's semantically incorrect to have to resort to using
    // <b>, <u>, <s>, <i> elements.
    element.getAttribute("style");
    element.removeAttribute("style");

    return {
      element,
    };
  }

  public override updateDOM(
    prevNode: CustomTextNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    return isUpdated;
  }
}

function wrapElementWith(element: HTMLElement, tag: string) {
  const el = document.createElement(tag);
  el.appendChild(element);
  return el;
}
