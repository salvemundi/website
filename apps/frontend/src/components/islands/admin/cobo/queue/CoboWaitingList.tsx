'use client';

import React, { useState } from 'react';
import { type CoboGuestBoard } from '@salvemundi/validations';
import { ListOrdered } from 'lucide-react';
import CoboQueueItem from './CoboQueueItem';

interface Props {
    boards: CoboGuestBoard[];
    onReorder: (fromIndex: number, toIndex: number) => void;
    onStatusChange: (id: number, status: string, name: string) => void;
    onDelete: (id: number, name: string) => void;
}

export default function CoboWaitingList({
    boards,
    onReorder,
    onStatusChange,
    onDelete
}: Props) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        onReorder(draggedIndex, targetIndex);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    if (boards.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border-color bg-bg-card py-12 text-center">
                <ListOrdered className="mx-auto mb-3 size-10 text-text-muted/40" />
                <p className="text-sm font-medium text-text-muted">De wachtrij is momenteel leeg.</p>
                <p className="mt-1 text-xs text-text-muted/70">Voeg hierboven een bestuur toe aan de rij.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {boards.map((board, index) => (
                <CoboQueueItem
                    key={board.id}
                    board={board}
                    index={index}
                    totalCount={boards.length}
                    isDragged={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onReorder={onReorder}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
