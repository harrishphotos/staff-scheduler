import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store/store";
import { Staff } from "../../../../types/staff";
import {
  selectRecurringBreaks,
  selectRecurringBreaksByDay,
  selectModalStates,
  selectLoadingStates,
  selectErrorStates,
  openRecurringBreakModal,
  closeRecurringBreakModal,
} from "../../../../store/slices/availabilitySlice";
import {
  createRecurringBreak,
  deleteRecurringBreak,
  fetchRecurringBreaks,
} from "../../../../store/thunks/availabilityThunk";
import {
  DAYS_OF_WEEK,
  CreateRecurringBreakRequest,
} from "../../../../types/availability";
import { availabilityHelpers } from "../../../../utils/availabilityApi";
import RecurringBreakModal from "../../modals/availability/RecurringBreakModal";

interface RecurringBreaksTabProps {
  staff: Staff;
}

const RecurringBreaksTab: React.FC<RecurringBreaksTabProps> = ({ staff }) => {
  const dispatch = useDispatch<AppDispatch>();
  const recurringBreaks = useSelector(selectRecurringBreaks);
  const breaksByDay = useSelector(selectRecurringBreaksByDay);
  const modalStates = useSelector(selectModalStates);
  const loadingStates = useSelector(selectLoadingStates);
  const errorStates = useSelector(selectErrorStates);

  const handleAddBreak = () => {
    dispatch(openRecurringBreakModal({ mode: "add" }));
  };

  const handleEditBreak = (breakItem: any) => {
    dispatch(openRecurringBreakModal({ mode: "edit", data: breakItem }));
  };

  const handleCloseModal = () => {
    dispatch(closeRecurringBreakModal());
  };

  const handleSubmitBreak = (breakData: CreateRecurringBreakRequest) => {
    dispatch(createRecurringBreak(breakData));
  };

  const handleDeleteBreak = async (breakId: string) => {
    await dispatch(deleteRecurringBreak(breakId));
    // Refresh the breaks after deletion
    dispatch(fetchRecurringBreaks(staff.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recurring Breaks
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage {staff.firstName}'s regular breaks (lunch, coffee, etc.)
          </p>
        </div>
        <button
          onClick={handleAddBreak}
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
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
          <span>Add Break</span>
        </button>
      </div>

      {/* Weekly Breaks Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Weekly Breaks
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayBreaks = breaksByDay[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {day.label}
                </h5>

                {dayBreaks.length > 0 ? (
                  <div className="space-y-2">
                    {dayBreaks.map((breakItem, index) => (
                      <div
                        key={index}
                        className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-3 py-2 rounded cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/70 transition-colors"
                        onClick={() => handleEditBreak(breakItem)}
                      >
                        <div className="text-sm font-medium">
                          {availabilityHelpers.formatTime(breakItem.start_time)}{" "}
                          - {availabilityHelpers.formatTime(breakItem.end_time)}
                        </div>
                        <div className="text-xs opacity-75">
                          {breakItem.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                    No breaks set
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Breaks List */}
      {recurringBreaks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            All Recurring Breaks ({recurringBreaks.length})
          </h4>
          <div className="space-y-3">
            {recurringBreaks.map((breakItem) => (
              <div
                key={breakItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => handleEditBreak(breakItem)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {DAYS_OF_WEEK[breakItem.day_of_week]?.label ||
                        "Unknown Day"}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {availabilityHelpers.formatTime(breakItem.start_time)} -{" "}
                      {availabilityHelpers.formatTime(breakItem.end_time)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded">
                      {breakItem.reason}
                    </span>
                  </div>
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
      {recurringBreaks.length === 0 && (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No recurring breaks configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Set up regular breaks like lunch, coffee breaks, or other recurring
            time slots for {staff.firstName}.
          </p>
          <button
            onClick={handleAddBreak}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Add First Break
          </button>
        </div>
      )}

      {/* Recurring Break Modal */}
      <RecurringBreakModal
        isOpen={modalStates.recurringBreak.isOpen}
        mode={modalStates.recurringBreak.mode}
        recurringBreak={modalStates.recurringBreak.data}
        employeeId={staff.id}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBreak}
        onDelete={handleDeleteBreak}
        loading={loadingStates.recurringBreaks}
        error={errorStates.recurringBreaks}
      />
    </div>
  );
};

export default RecurringBreaksTab;
