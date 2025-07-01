import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store/store";
import { Staff } from "../../../../types/staff";
import {
  selectSchedules,
  selectWeeklySchedule,
  selectModalStates,
  selectLoadingStates,
  selectErrorStates,
  openScheduleModal,
  closeScheduleModal,
} from "../../../../store/slices/availabilitySlice";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
} from "../../../../store/thunks/availabilityThunk";
import {
  DAYS_OF_WEEK,
  CreateScheduleRequest,
} from "../../../../types/availability";
import { availabilityHelpers } from "../../../../utils/availabilityApi";
import ScheduleModal from "../../modals/availability/ScheduleModal";

interface SchedulesTabProps {
  staff: Staff;
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({ staff }) => {
  const dispatch = useDispatch<AppDispatch>();
  const schedules = useSelector(selectSchedules);
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const modalStates = useSelector(selectModalStates);
  const loadingStates = useSelector(selectLoadingStates);
  const errorStates = useSelector(selectErrorStates);

  const handleAddSchedule = () => {
    dispatch(openScheduleModal({ mode: "add" }));
  };

  const handleEditSchedule = (schedule: any) => {
    dispatch(openScheduleModal({ mode: "edit", data: schedule }));
  };

  const handleCloseModal = () => {
    dispatch(closeScheduleModal());
  };

  const handleSubmitSchedule = (scheduleData: CreateScheduleRequest) => {
    dispatch(createSchedule(scheduleData));
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await dispatch(deleteSchedule(scheduleId));
    // Refresh the schedules after deletion
    dispatch(fetchSchedules(staff.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Work Schedules
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage {staff.firstName}'s work hours and schedules
          </p>
        </div>
        <button
          onClick={handleAddSchedule}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Weekly Schedule
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = weeklySchedule[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {day.label}
                </h5>

                {daySchedules.length > 0 ? (
                  <div className="space-y-2">
                    {daySchedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-2 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        <div className="text-sm font-medium">
                          {availabilityHelpers.formatTime(schedule.start_time)}{" "}
                          - {availabilityHelpers.formatTime(schedule.end_time)}
                        </div>
                        {schedule.notes && (
                          <div className="text-xs opacity-75">
                            {schedule.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                    No schedule set
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Schedules List */}
      {schedules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            All Schedules ({schedules.length})
          </h4>
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => handleEditSchedule(schedule)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {DAYS_OF_WEEK[schedule.day_of_week]?.label ||
                        "Unknown Day"}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {availabilityHelpers.formatTime(schedule.start_time)} -{" "}
                      {availabilityHelpers.formatTime(schedule.end_time)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Valid from: {schedule.valid_from}
                      {schedule.valid_until && ` to ${schedule.valid_until}`}
                    </span>
                  </div>
                  {schedule.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {schedule.notes}
                    </p>
                  )}
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No work schedules configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Set up {staff.firstName}'s work schedule to define when they're
            available.
          </p>
          <button
            onClick={handleAddSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Add First Schedule
          </button>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={modalStates.schedule.isOpen}
        mode={modalStates.schedule.mode}
        schedule={modalStates.schedule.data}
        employeeId={staff.id}
        onClose={handleCloseModal}
        onSubmit={handleSubmitSchedule}
        onDelete={handleDeleteSchedule}
        loading={loadingStates.schedules}
        error={errorStates.schedules}
      />
    </div>
  );
};

export default SchedulesTab;
