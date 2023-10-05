import {
  $createHeadingNode,
  HeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  NodeKey,
  isHTMLElement,
} from "lexical";

export class CustomHeadingNode extends HeadingNode {
  static getType(): string {
    return "custom-heading";
  }

  static clone(node: CustomHeadingNode): CustomHeadingNode {
    return new CustomHeadingNode(node.__tag, node.__key);
  }

  constructor(tag: HeadingTagType, key?: NodeKey) {
    super(tag, key);
    super.__tag = tag;
  }

  getTag(): HeadingTagType {
    return this.__tag;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);

    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) element.append(document.createElement("br"));

      /*
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;

      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
      }
      */
    }

    return {
      element,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const theme = config.theme;
    const classNames = theme.heading;
    return element;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      h1: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
      h2: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
      h3: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
      h4: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
      h5: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
      h6: (node: Node) => ({
        conversion: convertHeadingElement,
        priority: 1,
      }),
    };
  }
}

function convertHeadingElement(element: HTMLElement): DOMConversionOutput {
  const nodeName = element.nodeName.toLowerCase();

  if (element.getAttribute("data-diff-node") === "del") {
    return { node: null };
  }

  let node = null;
  if (
    nodeName === "h1" ||
    nodeName === "h2" ||
    nodeName === "h3" ||
    nodeName === "h4" ||
    nodeName === "h5" ||
    nodeName === "h6"
  ) {
    node = $createHeadingNode(nodeName);
    if (element.style !== null) {
      node.setFormat(element.style.textAlign as ElementFormatType);
    }
  }
  return { node };
}
