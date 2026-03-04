import React from 'react';
import { Icons } from '../icons';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    type, // 'alert' or 'confirm'
    severity, // 'info', 'success', 'warning', 'danger'
    onConfirm,
    onCancel,
}) {
    // Determine Icon based on severity
    const getIcon = () => {
        switch (severity) {
            case 'success': return <Icons.CheckCircle className="text-success h-12 w-12" />;
            case 'danger': return <Icons.XCircle className="text-danger h-12 w-12" />;
            case 'warning': return <Icons.AlertCircle className="text-warning h-12 w-12" />;
            default: return <Icons.Info className="text-blue-500 h-12 w-12" />;
        }
    };

    const getVariant = () => {
        switch (severity) {
            case 'success': return 'success';
            case 'danger': return 'danger';
            case 'warning': return 'warning';
            default: return 'primary';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel || onConfirm}
            title={title}
        >
            <div className="flex flex-col items-center text-center space-y-6 pt-2">
                <div className="bg-gray-50 p-4 rounded-full">
                    {getIcon()}
                </div>

                <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                        {message}
                    </p>
                </div>

                <div className="flex w-full gap-3 mt-4">
                    {type === 'confirm' && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 rounded-xl py-2.5"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        variant={getVariant()}
                        onClick={onConfirm}
                        className="flex-1 rounded-xl py-2.5"
                    >
                        {type === 'confirm' ? 'Confirm' : 'OK'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
