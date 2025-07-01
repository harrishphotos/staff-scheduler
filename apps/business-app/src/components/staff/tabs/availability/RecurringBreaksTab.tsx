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
import { Plus, Edit3, Coffee } from "lucide-react";

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
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white/95 mb-1">
            Recurring Breaks
          </h3>
          <p className="text-sm text-white/60">
            Manage {staff.firstName}'s regular breaks (lunch, coffee, etc.)
          </p>
        </div>
        <button
          onClick={handleAddBreak}
          className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Break</span>
        </button>
      </div>

      {/* Weekly Breaks Grid */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-medium text-white/95 mb-4">Weekly Breaks</h4>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayBreaks = breaksByDay[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-200"
              >
                <h5 className="font-medium text-white/95 mb-3 text-center text-sm">
                  {day.label}
                </h5>

                {dayBreaks.length > 0 ? (
                  <div className="space-y-2">
                    {dayBreaks.map((breakItem, index) => (
                      <div
                        key={index}
                        className="bg-orange-500/20 text-orange-400 px-3 py-2 rounded-lg cursor-pointer hover:bg-orange-500/30 transition-all duration-200 border border-orange-400/30 group"
                        onClick={() => handleEditBreak(breakItem)}
                      >
                        <div className="text-sm font-medium">
                          {availabilityHelpers.formatTime(breakItem.start_time)}{" "}
                          - {availabilityHelpers.formatTime(breakItem.end_time)}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {breakItem.reason}
                        </div>
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity duration-200 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/50 text-center py-4 border-2 border-dashed border-white/20 rounded-lg">
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
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white/95 mb-4">
            All Recurring Breaks ({recurringBreaks.length})
          </h4>
          <div className="space-y-3">
            {recurringBreaks.map((breakItem) => (
              <div
                key={breakItem.id}
                className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => handleEditBreak(breakItem)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-white/95">
                      {DAYS_OF_WEEK[breakItem.day_of_week]?.label ||
                        "Unknown Day"}
                    </span>
                    <span className="text-white/70">
                      {availabilityHelpers.formatTime(breakItem.start_time)} -{" "}
                      {availabilityHelpers.formatTime(breakItem.end_time)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-400/30">
                      {breakItem.reason}
                    </span>
                  </div>
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
      {recurringBreaks.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
            <Coffee className="w-12 h-12 text-white/50" />
          </div>
          <h3 className="text-lg font-medium text-white/95 mb-2">
            No Recurring Breaks
          </h3>
          <p className="text-white/60 mb-6">
            {staff.firstName} doesn't have any recurring breaks set up yet. Add
            breaks like lunch or coffee time.
          </p>
          <button
            onClick={handleAddBreak}
            className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Break</span>
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
