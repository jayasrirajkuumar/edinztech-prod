import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert', // 'alert' (OK only) or 'confirm' (OK/Cancel)
        severity: 'info', // 'info', 'success', 'warning', 'danger'
        onConfirm: null,
        onCancel: null,
    });

    const showConfirm = useCallback((options) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title: options.title || 'Attention',
                message: options.message || '',
                type: options.type || 'confirm',
                severity: options.severity || 'info',
                onConfirm: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    const showAlert = useCallback((options) => {
        setState({
            isOpen: true,
            title: options.title || 'Alert',
            message: options.message || '',
            type: 'alert',
            severity: options.severity || 'info',
            onConfirm: () => {
                setState(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: null,
        });
    }, []);

    return (
        <ConfirmContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            <ConfirmDialog
                isOpen={state.isOpen}
                {...state}
            />
        </ConfirmContext.Provider>
    );
};
