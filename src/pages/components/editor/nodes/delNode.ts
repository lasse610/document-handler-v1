import {
  type DOMConversionMap,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  TextNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical";

export class DelNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
    super.setStyle("background-color: red");
  }

  static importDOM(): DOMConversionMap | null {
    return {
      del: (element) => {
        console.log("del importDOM");
        return {
          conversion: convertDelNodeFn,
          priority: 3,
        };
      },
    };
  }

  static getType(): string {
    return "del";
  }

  static clone(node: DelNode): DelNode {
    return new DelNode(node.__text);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    // element.style.color = this.__color;
    return element;
  }

  updateDOM(
    prevNode: DelNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    return isUpdated;
  }
}

export function $createDelNode(text: string, color: string): DelNode {
  return new DelNode(text, color);
}

export function $isDelNode(
  node: LexicalNode | null | undefined,
): node is DelNode {
  return node instanceof DelNode;
}

function convertDelNodeFn(element: HTMLElement) {
  const text = element.textContent ?? "";
  return { node: new TextNode("") };
}
