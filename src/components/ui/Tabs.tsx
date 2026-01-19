import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    children?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTab,
    onChange,
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    return (
        <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                        flex items-center gap-2 px-4 py-3
                        text-sm font-medium
                        border-b-2 -mb-px
                        transition-colors
                        ${activeTab === tab.id
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                        }
                    `}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
