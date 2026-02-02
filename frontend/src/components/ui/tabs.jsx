import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create context for tabs
const TabsContext = createContext();

// Main Tabs component
const Tabs = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className = '',
  orientation = 'horizontal',
  activationMode = 'automatic',
  ...props 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || value || '');

  // Update active tab if value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleValueChange = (newValue) => {
    if (activationMode === 'automatic') {
      setActiveTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const contextValue = {
    activeTab,
    setActiveTab: handleValueChange,
    orientation,
    activationMode
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div 
        className={`tabs-root ${className}`} 
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
const TabsList = ({ children, className = '', ...props }) => {
  const { orientation } = useContext(TabsContext);

  return (
    <div 
      className={`tabs-list ${className}`}
      role="tablist"
      aria-orientation={orientation}
      {...props}
    >
      {children}
    </div>
  );
};

// TabsTrigger component
const TabsTrigger = ({ 
  value, 
  children, 
  className = '',
  disabled = false,
  ...props 
}) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);

  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    switch(e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        setActiveTab(value);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        // Focus management would go here
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        // Focus management would go here
        break;
      default:
        break;
    }
  };

  return (
    <button
      className={`tabs-trigger ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-content-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      data-state={isActive ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </button>
  );
};

// TabsContent component
const TabsContent = ({ 
  value, 
  children, 
  className = '',
  forceMount = false,
  ...props 
}) => {
  const { activeTab } = useContext(TabsContext);

  if (!forceMount && activeTab !== value) {
    return null;
  }

  const isActive = activeTab === value;

  return (
    <div
      className={`tabs-content ${className}`}
      role="tabpanel"
      aria-labelledby={`tab-trigger-${value}`}
      hidden={!isActive}
      id={`tab-content-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </div>
  );
};

// PropTypes for better development experience
Tabs.propTypes = {
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  activationMode: PropTypes.oneOf(['automatic', 'manual']),
};

TabsList.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  forceMount: PropTypes.bool,
};

// CSS styles (can be moved to a separate CSS file)
const tabsStyles = `
/* Tabs Root */
.tabs-root {
  width: 100%;
}

.tabs-root[data-orientation="vertical"] {
  display: flex;
}

/* Tabs List */
.tabs-list {
  display: inline-flex;
  align-items: center;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  padding: 0.25rem;
  margin-bottom: 1rem;
}

.tabs-root[data-orientation="vertical"] .tabs-list {
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 0;
  margin-right: 1rem;
}

/* Tabs Trigger */
.tabs-trigger {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: #6b7280;
  background-color: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.tabs-trigger:hover:not(.disabled) {
  color: #374151;
  background-color: #f3f4f6;
}

.tabs-trigger.active {
  color: #111827;
  background-color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.tabs-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.tabs-root[data-orientation="vertical"] .tabs-trigger {
  justify-content: flex-start;
}

/* Tabs Content */
.tabs-content {
  margin-top: 0.5rem;
  animation: fadeIn 200ms ease-out;
}

.tabs-content[data-state="inactive"] {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tabs-root[data-orientation="vertical"] .tabs-content {
  margin-top: 0;
  margin-left: 0.5rem;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'custom-tabs-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = tabsStyles;
    document.head.appendChild(styleSheet);
  }
}

// Export components
export { Tabs, TabsList, TabsTrigger, TabsContent };