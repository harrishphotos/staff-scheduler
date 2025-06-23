import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectServices } from "../../../../../store/slices/serviceSlice";
import {
  selectAppointmentForm,
  updateBookingSlots,
} from "../../../../../store/slices/appointmentFormSlice";
import { addMinutes, formatISO, parseISO } from "date-fns";
import { SortableItem } from "./SortableItem";

/**
 * Main component for the reorderable service list.
 * Allows drag-and-drop reordering of booking slots and updates their times.
 */
const ReorderableServiceList: React.FC = () => {
  const dispatch = useDispatch();

  // Select Redux state
  const { bookingSlots, startTime } = useSelector(selectAppointmentForm);
  const services = useSelector(selectServices);

  // State to manage the order of booking slots
  const [orderedSlots, setOrderedSlots] = useState(bookingSlots);

  /**
   * Updates the booking slots with calculated start and end times.
   * Dispatches the updated slots to the Redux store.
   */
  const updateBookingSlotsWithTimes = () => {
    if (!startTime || !orderedSlots.length || !services.length) {
      return orderedSlots; // Return empty if no start time or slots
    }
    let current = parseISO(startTime);

    const updatedSlots = orderedSlots.map((slot) => {
      const service = services.find((s) => s.serviceId === slot.serviceId);

      if (!service) {
        throw new Error(`Service not found for ID: ${slot.serviceId}`);
      }

      const startISO = formatISO(current);
      const end = addMinutes(current, service.duration);
      const endISO = formatISO(end);

      current = end; // move to next starting point

      return {
        ...slot,
        start_time: startISO,
        end_time: endISO,
      };
    });

    dispatch(updateBookingSlots(updatedSlots));

    return updatedSlots;
  };

  // Update booking slots whenever dependencies change
  useEffect(() => {
    updateBookingSlotsWithTimes();
  }, [startTime, services, orderedSlots, dispatch]);

  console.log("Starting time:", startTime);
  console.log("bookingSlots:", bookingSlots);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        // Handle reordering of slots
        if (active.id !== over?.id) {
          const oldIndex = orderedSlots.findIndex(
            (slot) => slot.serviceId === active.id
          );
          const newIndex = orderedSlots.findIndex(
            (slot) => slot.serviceId === over?.id
          );
          setOrderedSlots(arrayMove(orderedSlots, oldIndex, newIndex));
        }
      }}
    >
      <SortableContext
        items={orderedSlots.map((slot) => slot.serviceId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {/* Render each sortable item */}
          {bookingSlots.map((slot) => (
            <SortableItem key={slot.serviceId} item={slot} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default ReorderableServiceList;
