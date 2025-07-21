// Force Graph Web Worker
// This worker handles layout calculations to prevent UI blocking

// Listen for messages from the main thread
self.onmessage = function(event) {
  const data = event.data;
  
  if (!data || !data.nodes || !data.links) {
    self.postMessage({ error: 'Invalid data received' });
    return;
  }
  
  try {
    // Simple force-directed layout calculation
    // In a real implementation, you might want to use d3-force or a similar library
    // But for this example, we'll just do some basic position adjustments
    
    const nodes = data.nodes.map(node => ({
      ...node,
      // If node already has position, use it, otherwise assign random position
      x: node.x || Math.random() * 1000 - 500,
      y: node.y || Math.random() * 1000 - 500,
      // Add some velocity for simulation
      vx: 0,
      vy: 0
    }));
    
    // Create a map for quick node lookup
    const nodeMap = {};
    nodes.forEach((node, i) => {
      nodeMap[node.id] = i;
    });
    
    // Process links to create forces between nodes
    const links = data.links.map(link => {
      const sourceIndex = typeof link.source === 'object' ? 
        nodeMap[link.source.id] : nodeMap[link.source];
      const targetIndex = typeof link.target === 'object' ? 
        nodeMap[link.target.id] : nodeMap[link.target];
      
      return {
        ...link,
        sourceIndex,
        targetIndex
      };
    }).filter(link => link.sourceIndex !== undefined && link.targetIndex !== undefined);
    
    // Run a simple force simulation
    const iterations = 50; // Number of iterations to run
    const repulsionForce = 10; // Repulsion between nodes
    const attractionForce = 0.1; // Attraction along links
    
    for (let iter = 0; iter < iterations; iter++) {
      // Apply repulsion forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsionForce / (distance * distance);
          
          // Apply force to both nodes in opposite directions
          const fx = dx / distance * force;
          const fy = dy / distance * force;
          
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }
      
      // Apply attraction forces along links
      for (const link of links) {
        const sourceNode = nodes[link.sourceIndex];
        const targetNode = nodes[link.targetIndex];
        
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Force is proportional to distance
        const force = distance * attractionForce;
        
        const fx = dx / distance * force;
        const fy = dy / distance * force;
        
        if (!sourceNode || !targetNode) {
          console.warn('Missing node in force calculation');
          return;
        }
        if (sourceNode && targetNode) {
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      }
      
      // Update positions based on velocities
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        
        // Dampen velocities
        node.vx *= 0.9;
        node.vy *= 0.9;
      }
    }
    
    // Send the calculated positions back to the main thread
    self.postMessage({ nodes });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};