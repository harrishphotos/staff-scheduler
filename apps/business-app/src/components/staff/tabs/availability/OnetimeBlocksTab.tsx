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
import { Plus, Edit3, CalendarX, Clock } from "lucide-react";

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
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white/95 mb-1">
            Time Off Blocks
          </h3>
          <p className="text-sm text-white/60">
            Manage {staff.firstName}'s vacation days, sick leave, and other
            time-off
          </p>
        </div>
        <button
          onClick={handleAddBlock}
          className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Time Off</span>
        </button>
      </div>

      {/* Summary Cards */}
      {onetimeBlocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center justify-center">
                  <CalendarX className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-400">Total Blocks</p>
                <p className="text-2xl font-semibold text-white/95">
                  {onetimeBlocks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center justify-center">
                  <CalendarX className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-400">Upcoming</p>
                <p className="text-2xl font-semibold text-white/95">
                  {futureBlocks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                  <CalendarX className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-400">Past</p>
                <p className="text-2xl font-semibold text-white/95">
                  {pastBlocks.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Time Off */}
      {futureBlocks.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white/95 mb-4">
            Upcoming Time Off ({futureBlocks.length})
          </h4>
          <div className="space-y-3">
            {futureBlocks.map((block) => (
              <div
                key={block.id}
                className="group flex items-center justify-between p-4 bg-red-500/10 border border-red-400/30 rounded-lg hover:bg-red-500/15 transition-all duration-200 cursor-pointer"
                onClick={() => handleEditBlock(block)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-red-400">
                      {block.reason}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded border border-red-400/30">
                      {calculateDuration(
                        block.start_date_time,
                        block.end_date_time
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-white/60">
                      {formatDateTime(block.start_date_time)}
                    </span>
                    <span className="text-sm text-white/50">→</span>
                    <span className="text-sm text-white/60">
                      {formatDateTime(block.end_date_time)}
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

      {/* Past Time Off */}
      {pastBlocks.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white/95 mb-4">
            Past Time Off ({pastBlocks.length})
          </h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {pastBlocks.map((block) => (
              <div
                key={block.id}
                className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => handleEditBlock(block)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white/95">
                      {block.reason}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-white/10 text-white/70 rounded border border-white/15">
                      {calculateDuration(
                        block.start_date_time,
                        block.end_date_time
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-white/60">
                      {formatDateTime(block.start_date_time)}
                    </span>
                    <span className="text-sm text-white/50">→</span>
                    <span className="text-sm text-white/60">
                      {formatDateTime(block.end_date_time)}
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
      {onetimeBlocks.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
            <CalendarX className="w-12 h-12 text-white/50" />
          </div>
          <h3 className="text-lg font-medium text-white/95 mb-2">
            No Time Off Blocks
          </h3>
          <p className="text-white/60 mb-6">
            {staff.firstName} doesn't have any time-off blocks scheduled. Add
            vacation days, sick leave, or other time-off periods.
          </p>
          <button
            onClick={handleAddBlock}
            className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Time Off</span>
          </button>
        </div>
      )}

      {/* Onetime Block Modal */}
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
