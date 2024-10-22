import React from 'react';

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
            <img src={module.image} alt={module.name} />
            <span>{module.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;