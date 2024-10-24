import React from 'react';
import './Sidebar.scss'; // Import the CSS file

const Sidebar = ({ modules, onDragStart }) => {
  return (
    <div className="sidebar">
      <h2>Modules</h2>
      <ul>
        {modules.map((module, index) => (
          <li
            key={index}
            onMouseDown={(e) => onDragStart(e, module)}
            className="module-item"
          >
            <img src={module.image} alt={module.name} className="module-image" />
            <span className="module-name">{module.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;