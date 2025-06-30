import {
  Staff,
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffApiResponse,
} from "../types/staff";
import axiosInstance from "../api/axios";

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
    const { data: apiResponses } = await axiosInstance.get<StaffApiResponse[]>(
      "/api/employees"
    );

    const transformedStaff = apiResponses.map(transformApiResponseToStaff);
    console.log("🔄 Transformed staff data:", transformedStaff);

    return transformedStaff;
  },

  // Get staff member by ID
  getById: async (id: string): Promise<Staff> => {
    const { data: apiResponse } = await axiosInstance.get<StaffApiResponse>(
      `/api/employees/${id}`
    );
    return transformApiResponseToStaff(apiResponse);
  },

  // Create new staff member
  create: async (
    staff: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ): Promise<Staff> => {
    const requestBody = transformStaffToApiRequest(staff);
    const { data: apiResponse } = await axiosInstance.post<StaffApiResponse>(
      "/api/employees",
      requestBody
    );
    return transformApiResponseToStaff(apiResponse);
  },

  // Update existing staff member
  update: async (id: string, updates: Partial<Staff>): Promise<Staff> => {
    const requestBody = transformStaffToApiRequest(updates);
    const { data: apiResponse } = await axiosInstance.put<StaffApiResponse>(
      `/api/employees/${id}`,
      requestBody
    );
    return transformApiResponseToStaff(apiResponse);
  },

  // Delete staff member
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/employees/${id}`);
  },

  // Toggle staff active status
  toggleActiveStatus: async (id: string, isActive: boolean): Promise<Staff> => {
    const { data: apiResponse } = await axiosInstance.put<StaffApiResponse>(
      `/api/employees/${id}`,
      { is_active: isActive }
    );
    return transformApiResponseToStaff(apiResponse);
  },
};
