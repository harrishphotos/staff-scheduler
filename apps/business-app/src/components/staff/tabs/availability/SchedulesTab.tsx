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
import { Plus, Edit3 } from "lucide-react";

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
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white/95 mb-1">
            Work Schedules
          </h3>
          <p className="text-sm text-white/60">
            Manage {staff.firstName}'s work hours and schedules
          </p>
        </div>
        <button
          onClick={handleAddSchedule}
          className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-medium text-white/95 mb-4">Weekly Schedule</h4>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = weeklySchedule[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-200"
              >
                <h5 className="font-medium text-white/95 mb-3 text-center text-sm">
                  {day.label}
                </h5>

                {daySchedules.length > 0 ? (
                  <div className="space-y-2">
                    {daySchedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-all duration-200 border border-blue-400/30 group"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        <div className="text-sm font-medium">
                          {availabilityHelpers.formatTime(schedule.start_time)}{" "}
                          - {availabilityHelpers.formatTime(schedule.end_time)}
                        </div>
                        {schedule.notes && (
                          <div className="text-xs opacity-75 mt-1">
                            {schedule.notes}
                          </div>
                        )}
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity duration-200 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/50 text-center py-4 border-2 border-dashed border-white/20 rounded-lg">
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
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white/95 mb-4">
            All Schedules ({schedules.length})
          </h4>
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => handleEditSchedule(schedule)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-white/95">
                      {DAYS_OF_WEEK[schedule.day_of_week]?.label ||
                        "Unknown Day"}
                    </span>
                    <span className="text-white/70">
                      {availabilityHelpers.formatTime(schedule.start_time)} -{" "}
                      {availabilityHelpers.formatTime(schedule.end_time)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white/60">
                        Valid from: {schedule.valid_from}
                      </span>
                      {schedule.valid_until && (
                        <>
                          <span className="text-white/50">•</span>
                          <span className="text-sm text-white/60">
                            to {schedule.valid_until}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {schedule.notes && (
                    <p className="text-sm text-white/60 mt-2">
                      {schedule.notes}
                    </p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Edit3 className="w-5 h-5 text-white/60 hover:text-white/90 transition-colors duration-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-white/50"
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
          <h3 className="text-lg font-medium text-white/95 mb-2">
            No Work Schedules
          </h3>
          <p className="text-white/60 mb-6">
            {staff.firstName} doesn't have any work schedules set up yet. Create
            the first schedule to get started.
          </p>
          <button
            onClick={handleAddSchedule}
            className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Schedule</span>
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
