import { User } from "lucide-react"; // or use an icon from react-icons
import React, { useState } from "react";
import { AvailableStaff, Staff } from "../../../../../types/staff";
import { useSelector } from "react-redux";
import { selectStaffState } from "../../../../../store/slices/staffSlice";

/**
 * Props for the ArtistCard component.
 */
interface ArtistCardProps {
  artist: AvailableStaff; // The artist data to display
}

/**
 * ArtistCard Component
 *
 * This component displays information about an artist (staff member).
 * It includes their profile picture, name, and role. If the profile picture
 * fails to load, a fallback icon is displayed.
 *
 * @param artist - The artist data passed as a prop.
 * @returns A styled card displaying the artist's details.
 */
const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  // State to track if the profile picture fails to load
  const [imgError, setImgError] = useState(false);

  // Select the staff list from the Redux store
  const { staffList } = useSelector(selectStaffState);

  // Find the staff member corresponding to the artist's staffId
  const staff = staffList.find((s) => s.id === artist.staffId) as
    | Staff
    | undefined;

  // If the staff member is not found, return null (or handle the case differently if needed)
  if (!staff) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded shadow">
      {/* Display fallback icon if the profile picture fails to load */}
      {imgError ? (
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="text-white w-6 h-6" />
        </div>
      ) : (
        <img
          src={staff.profilePic} // Staff profile picture URL
          alt={staff.firstName + " " + staff.lastName} // Alt text for the image
          className="w-12 h-12 rounded-full object-cover" // Styling for the image
          onError={() => setImgError(true)} // Set imgError to true if the image fails to load
        />
      )}

      {/* Display the staff member's name and role */}
      <div>
        <div className="font-medium text-white">
          {staff.firstName + " " + staff.lastName} {/* Full name */}
        </div>
        <div className="text-sm text-gray-400">
          {staff.role} {/* Role */}
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
