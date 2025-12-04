"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WidgetCard from "./WidgetCard";

/**
 * SortableWidgetCard Component
 * Wrapper around WidgetCard that enables drag-and-drop sorting
 */
export default function SortableWidgetCard({ widget, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <WidgetCard
        widget={widget}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging || isSortableDragging}
      />
    </div>
  );
}
