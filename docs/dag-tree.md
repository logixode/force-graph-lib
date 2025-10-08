# DAG Tree Visualization

A Directed Acyclic Graph (DAG) rendered as a hierarchical tree structure from top to bottom. This visualization is perfect for representing workflows, dependency graphs, decision trees, and other hierarchical data structures.

## Features

- **Top-to-Bottom Layout**: Clear hierarchical representation with nodes arranged in levels
- **Interactive Controls**: Adjust node spacing and level height in real-time
- **Sample Data Sets**: Multiple pre-configured examples to explore different use cases
- **Node Selection**: Click on nodes to view detailed information
- **Responsive Design**: Automatically adjusts to content size
- **Visual Indicators**: Color-coded nodes based on type (start, process, decision, end)

## Use Cases

This DAG tree visualization is ideal for:

- **Workflow Diagrams**: Visualize business processes and workflows
- **Decision Trees**: Show decision-making processes and outcomes
- **Dependency Graphs**: Display dependencies between components or tasks
- **Process Flows**: Illustrate step-by-step processes
- **Organizational Charts**: Show hierarchical relationships

<DagTree />

## Implementation Notes

The DAG tree component uses SVG for rendering, providing crisp graphics at any scale. The layout algorithm automatically positions nodes based on their hierarchical level, ensuring optimal spacing and readability.

### Node Types

- **Start Node** (Blue): Entry points or initial states
- **Process Node** (Green): Processing steps or operations
- **Decision Node** (Orange): Decision points or conditional logic
- **End Node** (Red): Terminal states or final outcomes

### Interactive Features

- **Node Selection**: Click any node to view its details in the info panel
- **Layout Controls**: Use the sliders to adjust spacing and height for optimal viewing
- **Sample Data**: Switch between different example datasets to explore various scenarios

The visualization automatically handles node positioning, link routing, and maintains proper hierarchical structure regardless of the complexity of your data.