import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
  ListType,
} from "@lexical/list";
import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  isHTMLElement,
} from "lexical";

export class CustomListNode extends ListNode {
  constructor(listType: ListType, start: number, key?: string | undefined) {
    super(listType, start, key);
  }
  static getType() {
    return "custom-list";
  }

  static clone(node: CustomListNode) {
    return new CustomListNode(node.__listType, node.__start, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ol: (node: Node) => ({
        conversion: convertListNode,
        priority: 1,
      }),
      ul: (node: Node) => ({
        conversion: convertListNode,
        priority: 1,
      }),
    };
  }

  createDOM(config: EditorConfig, _editor?: LexicalEditor): HTMLElement {
    const tag = this.__tag;
    const dom = document.createElement(tag);

    if (this.__start !== 1) {
      dom.setAttribute("start", String(this.__start));
    }
    // @ts-expect-error Internal field.
    dom.__lexicalListType = this.__listType;
    //setListThemeClassNames(dom, config.theme, this);

    return dom;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    if (element && isHTMLElement(element)) {
      if (this.__start !== 1) {
        element.setAttribute("start", String(this.__start));
      }
      /*
      if (this.__listType === "check") {
        element.setAttribute("__lexicalListType", "check");
      }
      */
    }
    return {
      element,
    };
  }
}

export function wrapInListItem(node: LexicalNode): ListItemNode {
  const listItemWrapper = $createListItemNode();
  return listItemWrapper.append(node);
}

function normalizeChildren(nodes: Array<LexicalNode>): Array<ListItemNode> {
  const normalizedListItems: Array<ListItemNode> = [];
  for (const node of nodes) {
    if ($isListItemNode(node)) {
      normalizedListItems.push(node);
      const children = node.getChildren();
      if (children.length > 1) {
        children.forEach((child) => {
          if ($isListNode(child)) {
            normalizedListItems.push(wrapInListItem(child));
          }
        });
      }
    } else {
      normalizedListItems.push(wrapInListItem(node));
    }
  }
  return normalizedListItems;
}

function convertListNode(domNode: Node): DOMConversionOutput {
  const nodeName = domNode.nodeName.toLowerCase();
  let node = null;

  if (isHTMLElement(domNode)) {
    const attr = domNode.getAttribute("data-diff-node");
    if (attr === "del") {
      return { node: null };
    }
  }

  if (nodeName === "ol") {
    // ts-ignore
    node = $createListNode("number");
  } else if (nodeName === "ul") {
    if (
      isHTMLElement(domNode) &&
      domNode.getAttribute("__lexicallisttype") === "check"
    ) {
      node = $createListNode("check");
    } else {
      node = $createListNode("bullet");
    }
  }

  return {
    after: normalizeChildren,
    node,
  };
}

export class CustomListItemNode extends ListItemNode {
  constructor(value?: number, checked?: boolean, key?: NodeKey) {
    super(value, checked, key);
  }

  static getType(): string {
    return "custom-listitem";
  }

  static clone(node: CustomListItemNode): CustomListItemNode {
    return new CustomListItemNode(node.__value, node.__checked, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      li: (node: Node) => ({
        conversion: convertListItemElement,
        priority: 1,
      }),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("li");
    const parent = this.getParent();
    if ($isListNode(parent) && parent.getListType() === "check") {
      updateListItemChecked(element, this, null, parent);
    }
    //element.value = this.__value;
    //$setListItemThemeClassNames(element, config.theme, this);
    return element;
  }
}

function convertListItemElement(domNode: Node): DOMConversionOutput {
  if (isHTMLElement(domNode)) {
    const attr = domNode.getAttribute("data-diff-node");
    if (attr === "del") {
      return { node: null };
    }
  }

  const checked =
    isHTMLElement(domNode) && domNode.getAttribute("aria-checked") === "true";
  return { node: $createListItemNode(checked) };
}

function updateListItemChecked(
  dom: HTMLElement,
  listItemNode: ListItemNode,
  prevListItemNode: ListItemNode | null,
  listNode: ListNode,
): void {
  // Only add attributes for leaf list items
  if ($isListNode(listItemNode.getFirstChild())) {
    dom.removeAttribute("role");
    dom.removeAttribute("tabIndex");
    dom.removeAttribute("aria-checked");
  } else {
    dom.setAttribute("role", "checkbox");
    dom.setAttribute("tabIndex", "-1");

    if (
      !prevListItemNode ||
      listItemNode.__checked !== prevListItemNode.__checked
    ) {
      dom.setAttribute(
        "aria-checked",
        listItemNode.getChecked() ? "true" : "false",
      );
    }
  }
}
