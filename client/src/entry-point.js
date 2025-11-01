// Entry point that avoids module aliases
// Import App directly using relative paths
import('./App.tsx').then(module => {
  const React = window.React || (() => {
    console.error('React not available');
  });
  
  import('react-dom/client').then(ReactDOM => {
    const App = module.default;
    const container = document.getElementById('root');
    if (container) {
      const root = ReactDOM.createRoot(container);
      // Use JSX transformer to handle this
      root.render(<App />);
    }
  });
});