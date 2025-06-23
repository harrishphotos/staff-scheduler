import {
  Staff,
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffApiResponse,
} from "../types/staff";

const EMPLOYEE_API_BASE = "http://localhost:3002";

// Helper function to transform API response to frontend Staff type
const transformApiResponseToStaff = (apiResponse: StaffApiResponse): Staff => ({
  id: apiResponse.id,
  firstName: apiResponse.first_name,
  lastName: apiResponse.last_name,
  email: apiResponse.email,
  profilePic: apiResponse.picture,
  role: apiResponse.role,
  isActive: apiResponse.is_active,
  createdAt: apiResponse.created_at,
  updatedAt: apiResponse.updated_at,
});

// Helper function to transform frontend Staff to API request
const transformStaffToApiRequest = (
  staff: Partial<Staff>
): CreateStaffRequest | UpdateStaffRequest => ({
  first_name: staff.firstName!,
  last_name: staff.lastName!,
  email: staff.email!,
  picture: staff.profilePic || "",
  role: staff.role!,
  is_active: staff.isActive!,
});

export const staffAPI = {
  // Get all staff members
  getAll: async (): Promise<Staff[]> => {
    console.log("🌐 Making API request to:", `${EMPLOYEE_API_BASE}/employees`);
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees`);
    console.log("📡 API response status:", response.status, response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      throw new Error(
        `Failed to fetch staff members: ${response.status} ${errorText}`
      );
    }

    const apiResponses: StaffApiResponse[] = await response.json();
    console.log("📄 Raw API data:", apiResponses);

    const transformedStaff = apiResponses.map(transformApiResponseToStaff);
    console.log("🔄 Transformed staff data:", transformedStaff);

    return transformedStaff;
  },

  // Get staff member by ID
  getById: async (id: string): Promise<Staff> => {
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch staff member");
    }
    const apiResponse: StaffApiResponse = await response.json();
    return transformApiResponseToStaff(apiResponse);
  },

  // Create new staff member
  create: async (
    staff: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ): Promise<Staff> => {
    const requestBody = transformStaffToApiRequest(staff);
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error("Failed to create staff member");
    }
    const apiResponse: StaffApiResponse = await response.json();
    return transformApiResponseToStaff(apiResponse);
  },

  // Update existing staff member
  update: async (id: string, updates: Partial<Staff>): Promise<Staff> => {
    const requestBody = transformStaffToApiRequest(updates);
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error("Failed to update staff member");
    }
    const apiResponse: StaffApiResponse = await response.json();
    return transformApiResponseToStaff(apiResponse);
  },

  // Delete staff member
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete staff member");
    }
  },

  // Toggle staff active status
  toggleActiveStatus: async (id: string, isActive: boolean): Promise<Staff> => {
    const response = await fetch(`${EMPLOYEE_API_BASE}/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!response.ok) {
      throw new Error("Failed to update staff status");
    }
    const apiResponse: StaffApiResponse = await response.json();
    return transformApiResponseToStaff(apiResponse);
  },
};
