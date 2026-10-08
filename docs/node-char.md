---
title: Node Char Example
---

# Node Char Example

This page demonstrates the `nodeChar` feature in `force-graph-lib`. Each node can display a character, number, or emoji **inside** its shape — rendered efficiently via `OffscreenCanvas` + `ImageBitmap` caching, making it suitable for graphs with thousands of nodes.

In this example, each node type maps to a distinct character:

| Type | Char | Description |
|------|------|-------------|
| Hub | ★ | Central topic nodes |
| Post | 📝 | Content posts |
| Repost | 🔁 | Shared/reposted content |
| Media | 🎬 | Video or image content |
| User | 👤 | User account nodes |

The `fontSize` for each node is proportional to its size, so larger nodes display a larger character — independently configured per node via the callback.

## Usage

```ts
new ForceGraph(container, data, {
  nodeCharSizeRatio: 0.8, // (optional) global fallback ratio. defaults to 80%
  nodeChar: (node) => {
    if (!node.icon) return null // skip this node entirely
    return {
      char: node.icon,      // letter, number, or emoji
      // fontSize: node.size,  // if omitted, uses (node.size * nodeCharSizeRatio)
      color: '#fff',
    }
  }
})
```

<DemoNodeChar />
