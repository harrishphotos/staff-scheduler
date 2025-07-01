import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store/store";
import { Staff } from "../../../../types/staff";
import {
  selectOnetimeBlocks,
  selectModalStates,
  selectLoadingStates,
  selectErrorStates,
  openOnetimeBlockModal,
  closeOnetimeBlockModal,
} from "../../../../store/slices/availabilitySlice";
import {
  createOnetimeBlock,
  updateOnetimeBlockThunk,
  deleteOnetimeBlock,
  fetchOnetimeBlocks,
} from "../../../../store/thunks/availabilityThunk";
import {
  CreateOnetimeBlockRequest,
  OnetimeBlock,
} from "../../../../types/availability";
import OnetimeBlockModal from "../../modals/availability/OnetimeBlockModal";

interface OnetimeBlocksTabProps {
  staff: Staff;
}

const OnetimeBlocksTab: React.FC<OnetimeBlocksTabProps> = ({ staff }) => {
  const dispatch = useDispatch<AppDispatch>();
  const onetimeBlocks = useSelector(selectOnetimeBlocks);
  const modalStates = useSelector(selectModalStates);
  const loadingStates = useSelector(selectLoadingStates);
  const errorStates = useSelector(selectErrorStates);

  const handleAddBlock = () => {
    dispatch(openOnetimeBlockModal({ mode: "add" }));
  };

  const handleEditBlock = (block: OnetimeBlock) => {
    dispatch(openOnetimeBlockModal({ mode: "edit", data: block }));
  };

  const handleCloseModal = () => {
    dispatch(closeOnetimeBlockModal());
  };

  const handleSubmitBlock = (blockData: CreateOnetimeBlockRequest) => {
    if (
      modalStates.onetimeBlock.mode === "edit" &&
      modalStates.onetimeBlock.data
    ) {
      // Update existing block
      dispatch(
        updateOnetimeBlockThunk({
          blockId: modalStates.onetimeBlock.data.id,
          blockData,
        })
      ).then(() => {
        // Refetch data to update the UI
        dispatch(fetchOnetimeBlocks(staff.id));
      });
    } else {
      // Create new block
      dispatch(createOnetimeBlock(blockData)).then(() => {
        // Refetch data to update the UI
        dispatch(fetchOnetimeBlocks(staff.id));
      });
    }
  };

  const handleDeleteBlock = () => {
    if (modalStates.onetimeBlock.data) {
      dispatch(deleteOnetimeBlock(modalStates.onetimeBlock.data.id)).then(
        () => {
          // Refetch data to update the UI
          dispatch(fetchOnetimeBlocks(staff.id));
        }
      );
    }
  };

  // Separate past and future blocks
  const now = new Date();
  const futureBlocks = onetimeBlocks.filter(
    (block) => new Date(block.start_date_time) >= now
  );
  const pastBlocks = onetimeBlocks.filter(
    (block) => new Date(block.end_date_time) < now
  );

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Time Off Blocks
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage {staff.firstName}'s time-off periods (vacation, sick leave,
            etc.)
          </p>
        </div>
        <button
          onClick={handleAddBlock}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
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
          <span>Add Time Off</span>
        </button>
      </div>

      {/* Upcoming Time Off */}
      {futureBlocks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Time Off ({futureBlocks.length})
          </h4>
          <div className="space-y-3">
            {futureBlocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                onClick={() => handleEditBlock(block)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {block.reason}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded">
                      {calculateDuration(
                        block.start_date_time,
                        block.end_date_time
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {formatDateTime(block.start_date_time)}
                    </span>
                    <span className="text-sm text-red-500 dark:text-red-400">
                      →
                    </span>
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {formatDateTime(block.end_date_time)}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300">
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

      {/* Past Time Off */}
      {pastBlocks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            Past Time Off ({pastBlocks.length})
          </h4>
          <div className="space-y-3">
            {pastBlocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-75"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {block.reason}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">
                      {calculateDuration(
                        block.start_date_time,
                        block.end_date_time
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(block.start_date_time)}
                    </span>
                    <span className="text-sm text-gray-400">→</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(block.end_date_time)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Time Off (if there are both past and future) */}
      {onetimeBlocks.length > 0 &&
        futureBlocks.length > 0 &&
        pastBlocks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
              All Time Off Blocks ({onetimeBlocks.length})
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {futureBlocks.length} upcoming • {pastBlocks.length} completed
            </div>
          </div>
        )}

      {/* Empty State */}
      {onetimeBlocks.length === 0 && (
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No time-off blocks configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add vacation time, sick leave, or other unavailable periods for{" "}
            {staff.firstName}.
          </p>
          <button
            onClick={handleAddBlock}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Add First Time Off
          </button>
        </div>
      )}

      {/* One-time Block Modal */}
      <OnetimeBlockModal
        isOpen={modalStates.onetimeBlock.isOpen}
        mode={modalStates.onetimeBlock.mode}
        onetimeBlock={modalStates.onetimeBlock.data}
        employeeId={staff.id}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBlock}
        onDelete={handleDeleteBlock}
        loading={loadingStates.onetimeBlocks}
        error={errorStates.onetimeBlocks}
      />
    </div>
  );
};

export default OnetimeBlocksTab;
