import React, { useState } from 'react';
import { Button } from '@/design-system';
import { InboxService } from '../services/InboxService';

export const DevToolbar: React.FC = () => {
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            await InboxService.seedDatabase();
            // Force reload might not be needed if store is reactive, 
            // but refreshing the page ensures clean slate if stuck.
            // window.location.reload(); 
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 9999
        }}>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                style={{ fontSize: '10px', opacity: 0.8 }}
            >
                {seeding ? 'Seeding...' : 'Seed Inbox DB'}
            </Button>
        </div>
    );
};
