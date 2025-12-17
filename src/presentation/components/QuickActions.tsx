// src/components/QuickActions.tsx
import React from "react";

interface QuickAction {
  label: string;
  img: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  activeLabel?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  activeLabel,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent, action: QuickAction) => {
    if (e.key === "Enter" && action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
      {actions.map((item, index) => {
        const isActive = item.label === activeLabel;

        return (
          <div
            key={index}
            title={item.label}
            role="button"
            tabIndex={0}
            onClick={item.onClick}
            onKeyDown={(e) => handleKeyPress(e, item)}
            className={`bg-white shadow rounded p-4 flex flex-col items-center 
                        hover:shadow-xl transition-transform transform hover:scale-105 cursor-pointer
                        ${isActive ? "ring-2 ring-red-500" : ""}`}
          >
            <img src={item.img} alt={item.label} className="mb-2 h-10 w-10" />
            <span className="font-semibold text-center text-sm">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default QuickActions;
