// src/components/TabBar.jsx
import { useState } from 'react';
import TabContextMenu from './TabContextMenu';

export default function TabBar({ tabs, activeTabId, onTabSwitch, onTabCreate, onTabClose, onTabRename, onTabDuplicate }) {
  const [contextMenu, setContextMenu] = useState({ isOpen: false, tab: null, position: { x: 0, y: 0 } });

  const handleContextMenu = (e, tab) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      tab,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, tab: null, position: { x: 0, y: 0 } });
  };

  const handleRename = () => {
    if (contextMenu.tab) {
      onTabRename(contextMenu.tab);
    }
  };

  const handleDuplicate = () => {
    if (contextMenu.tab) {
      onTabDuplicate(contextMenu.tab);
    }
  };

  return (
    <div className="bg-white border-b">
      <div className="mx-auto max-w-[80%] px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors border-b-4 ${
                tab.id === activeTabId
                  ? 'bg-purple-600 text-white font-bold border-purple-800'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent'
              }`}
              onClick={() => onTabSwitch(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab)}
            >
              <span className="text-sm whitespace-nowrap">{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab);
                }}
                className={`ml-1 text-lg leading-none hover:scale-110 transition-transform ${
                  tab.id === activeTabId
                    ? 'text-white hover:text-red-200'
                    : 'text-gray-500 hover:text-red-600'
                }`}
                title="Close tab"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={onTabCreate}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white hover:bg-purple-700 transition-colors flex-shrink-0"
            title="Create new tab"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      <TabContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}
