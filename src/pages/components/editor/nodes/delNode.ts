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

export class InvisibleDelNode extends CustomTextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
    super.setStyle("background-color: red");
  }

  static importDOM(): DOMConversionMap | null {
    return {
      del: (element) => {
        return {
          conversion: convertInvisibleDelNodeFn,
          priority: 3,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedTextNode) {
    const node = super.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedTextNode {
    const node = super.exportJSON();
    return node;
  }

  static getType(): string {
    return "del";
  }

  static clone(node: InvisibleDelNode): InvisibleDelNode {
    return new InvisibleDelNode(node.__text);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    // element.style.color = this.__color;
    return element;
  }

  updateDOM(
    prevNode: InvisibleDelNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    return isUpdated;
  }
}

export function $createInvisibleDelNode(
  text: string,
  color: string,
): InvisibleDelNode {
  return new InvisibleDelNode(text, color);
}

export function $isInvisibleDelNode(
  node: LexicalNode | null | undefined,
): node is InvisibleDelNode {
  return node instanceof InvisibleDelNode;
}

function convertInvisibleDelNodeFn(element: HTMLElement) {
  const text = element.textContent ?? "";
  return { node: new TextNode("") };
}

export class VisibleDelNode extends CustomTextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
    super.setStyle("background-color: red");
  }

  static importDOM(): DOMConversionMap | null {
    return {
      del: (element) => {
        return {
          conversion: convertVisibleDelNodeFn,
          priority: 3,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedTextNode) {
    const node = super.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedTextNode {
    const node = super.exportJSON();
    return node;
  }

  static getType(): string {
    return "del";
  }

  static clone(node: InvisibleDelNode): InvisibleDelNode {
    return new VisibleDelNode(node.__text);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    // element.style.color = this.__color;
    return element;
  }

  updateDOM(
    prevNode: InvisibleDelNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    return isUpdated;
  }
}

export function $createVisibleDelNode(
  visible: boolean,
  text: string,
  color: string,
): VisibleDelNode {
  return new VisibleDelNode(text, color);
}

export function $isVisibleDelNode(
  node: LexicalNode | null | undefined,
): node is VisibleDelNode {
  return node instanceof VisibleDelNode;
}

function convertVisibleDelNodeFn(element: HTMLElement) {
  const text = element.textContent ?? "";
  return { node: new VisibleDelNode(text) };
}
