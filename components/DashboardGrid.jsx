"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableWidgetCard from "./SortableWidgetCard";
import WidgetCard from "./WidgetCard";

/**
 * DashboardGrid Component
 * Renders a sortable grid of widgets using dnd-kit
 * Handles drag-and-drop reordering
 */
export default function DashboardGrid({ widgets, onReorder }) {
  const [activeId, setActiveId] = useState(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the active widget being dragged
  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end - reorder widgets
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(widgets, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Extract widget IDs for SortableContext
  const widgetIds = widgets.map((w) => w.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <SortableWidgetCard
              key={widget.id}
              widget={widget}
              isDragging={activeId === widget.id}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows the widget being dragged */}
      <DragOverlay adjustScale={false}>
        {activeWidget ? (
          <div className="opacity-90 rotate-2 scale-105">
            <WidgetCard widget={activeWidget} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
