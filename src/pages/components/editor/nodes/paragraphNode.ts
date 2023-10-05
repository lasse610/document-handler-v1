import {
  $createParagraphNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  NodeKey,
  ParagraphNode,
  isHTMLElement,
} from "lexical";
import { getCachedClassNameArray } from "lexical/LexicalUtils";

export class CustomParagraphNode extends ParagraphNode {
  static getType() {
    return "custom-paragraph";
  }

  static clone(node: CustomParagraphNode) {
    return new CustomParagraphNode(node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: (node: Node) => ({
        conversion: convertParagraphElement,
        priority: 1,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = super.createDOM(editor._config);

    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) element.append(document.createElement("br"));
      /*
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;
      const direction = this.getDirection();

      if (direction) {
        element.dir = direction;
      }

      const indent = this.getIndent();

      if (indent > 0) {
        // padding-inline-start is not widely supported in email HTML, but
        // Lexical Reconciler uses padding-inline-start. Using text-indent instead.
        element.style.textIndent = `${indent * 20}px`;
      }
        */
    }

    return {
      element,
    };
  }
}

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
  const node = $createParagraphNode();
  const attr = element.getAttribute("data-diff-node");

  if (attr === "del") {
    return { node: null };
  }

  if (element.style) {
    node.setFormat(element.style.textAlign as ElementFormatType);
    const indent = parseInt(element.style.textIndent, 10) / 20;
    if (indent > 0) {
      node.setIndent(indent);
    }
  }
  return { node };
}
