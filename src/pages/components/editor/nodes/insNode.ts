import {
  type DOMConversionMap,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  TextNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical";
import { CustomTextNode } from "./textNode";

export class InsNode extends CustomTextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
    super.setStyle("background-color: green");
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ins: (element) => {
        return {
          conversion: convertInsNodeFn,
          priority: 3,
        };
      },
    };
  }

  static getType(): string {
    return "ins";
  }

  static importJSON(serializedNode: SerializedTextNode) {
    const node = super.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedTextNode {
    const node = super.exportJSON();
    return node;
  }

  static clone(node: InsNode): InsNode {
    return new InsNode(node.__text);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    return element;
  }

  updateDOM(
    prevNode: InsNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    return isUpdated;
  }
}

export function $createInsNode(text: string, color: string): InsNode {
  return new InsNode(text, color);
}

export function $isInsNode(
  node: LexicalNode | null | undefined,
): node is InsNode {
  return node instanceof InsNode;
}

function convertInsNodeFn(element: HTMLElement) {
  const text = element.textContent ?? "";
  return { node: new InsNode(text) };
}
