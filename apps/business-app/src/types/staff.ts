// Staff type for frontend (maps to Employee in backend)
export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic?: string;
  role: string;
  services?: string[]; // List of service IDs this staff can perform
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// API request/response types for staff CRUD operations
export type CreateStaffRequest = {
  first_name: string;
  last_name: string;
  email: string;
  picture?: string;
  role: string;
  is_active: boolean;
};

export type UpdateStaffRequest = Partial<CreateStaffRequest>;

export type StaffApiResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  picture: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailableStaff = {
  staffId: string; // ID of the staff member
  serviceIds: string[]; // List of service IDs this staff can perform
  availability: {
    start: string; // Start time in ISO format
    end: string; // End time in ISO format
  }[]; // Array of availability slots
};
export const availableStaffdemo: AvailableStaff[] = [
  {
    staffId: "3a78a512-d2d3-4c8e-a882-f894303fae93", // E1
    serviceIds: [
      "3f1e52e0-7a8a-4c85-9841-f50b3e05dabb", // Haircut
      "62cfa3ec-cbfb-42f7-8d30-e391f8416b4f", // Facial
    ],
    availability: [
      {
        start: "2025-06-21T06:30:00.000Z",
        end: "2025-06-21T07:00:00.000Z",
      },
      {
        start: "2025-06-21T07:15:00.000Z",
        end: "2025-06-21T08:00:00.000Z",
      },
    ],
  },
  {
    staffId: "6e1b9c0f-66a9-4a47-9f14-bf2b6fbd3785", // E2
    serviceIds: [
      "f7454a8e-d9b0-4a30-9212-1f5a47c9e71d", // Shave
      "6dbd9d1c-9e52-4bd3-850d-0b0935d93929", // Manicure
    ],
    availability: [
      {
        start: "2025-06-21T06:30:00.000Z",
        end: "2025-06-21T07:30:00.000Z",
      },
    ],
  },
  {
    staffId: "2a03dc1e-0c88-417c-a6b3-301c879610df", // E3
    serviceIds: [
      "3f1e52e0-7a8a-4c85-9841-f50b3e05dabb", // Haircut
      "6dbd9d1c-9e52-4bd3-850d-0b0935d93929", // Manicure
    ],
    availability: [
      {
        start: "2025-06-21T06:45:00.000Z",
        end: "2025-06-21T07:15:00.000Z",
      },
      {
        start: "2025-06-21T07:30:00.000Z",
        end: "2025-06-21T08:00:00.000Z",
      },
    ],
  },
  {
    staffId: "8cb4768f-6c53-42d6-b95d-b48b503c7ec5", // E4
    serviceIds: [
      "f7454a8e-d9b0-4a30-9212-1f5a47c9e71d", // Shave
      "62cfa3ec-cbfb-42f7-8d30-e391f8416b4f", // Facial
    ],
    availability: [
      {
        start: "2025-06-21T07:00:00.000Z",
        end: "2025-06-21T07:45:00.000Z",
      },
      {
        start: "2025-06-21T07:50:00.000Z",
        end: "2025-06-21T08:20:00.000Z",
      },
    ],
  },
];

export const demoStaffs: Staff[] = [
  {
    id: "f290f1ee-6c54-4b01-90e6-d701748f0853", // Already UUID, kept
    firstName: "Sara",
    lastName: "Khan",
    email: "sara.khan@example.com",
    profilePic:
      "https://png.pngtree.com/thumb_back/fw800/background/20221001/pngtree-stylist-giving-a-haircut-to-woman-profession-barber-standing-photo-image_6821726.jpg",
    role: "Stylist",
    services: ["Facial", "Cleanup"],
    isActive: true,
  },
  {
    id: "3a78a512-d2d3-4c8e-a882-f894303fae93", // E1
    firstName: "Amal",
    lastName: "Ali",
    email: "amal.ali@example.com",
    profilePic:
      "https://img.freepik.com/premium-photo/photograph-barber-man-looking-profile-his-client_983424-5909.jpg",
    role: "Colorist",
    services: ["Haircut", "Hair Coloring"],
    isActive: true,
  },
  {
    id: "6e1b9c0f-66a9-4a47-9f14-bf2b6fbd3785", // E2
    firstName: "Eshan",
    lastName: "Perera",
    email: "eshan.perera@example.com",
    profilePic:
      "https://th.bing.com/th/id/R.81608a34674331ad18d84908fd662b9a?rik=IqT7qMz0Pawwcw&pid=ImgRaw&r=0",
    role: "Barber",
    services: ["Massage", "Haircut"],
    isActive: true,
  },
  {
    id: "2a03dc1e-0c88-417c-a6b3-301c879610df", // E3
    firstName: "Nila",
    lastName: "Fernando",
    email: "nila.fernando@example.com",
    profilePic: "https://via.placeholder.com/50",
    role: "Makeup Artist",
    services: ["Makeup", "Bridal Package"],
    isActive: false,
  },
  {
    id: "8cb4768f-6c53-42d6-b95d-b48b503c7ec5", // E4
    firstName: "Tariq",
    lastName: "Hassan",
    email: "tariq.hassan@example.com",
    profilePic: "https://example.com/images/tariq.jpg",
    role: "Manager",
    services: ["Makeup", "Bridal Package"],
    isActive: true,
  },
];
