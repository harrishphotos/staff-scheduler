import {
  selectAppointmentForm,
  updateFormData,
} from "apps/business-app/src/store/slices/appointmentFormSlice";
import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

// Define the props for the CustomerForm component
type Props = {
  onNext: () => void; // Callback function triggered when the "Next" button is clicked
};

// CustomerForm component handles customer details input and validation
const CustomerForm: React.FC<Props> = ({ onNext }) => {
  // Access the form data from the Redux store
  const { formData } = useSelector(selectAppointmentForm);

  console.log("CustomerForm rendered with formData:", formData);

  // Check if the form is valid (both customer name and number must be non-empty)
  const isFormValid =
    (formData?.customerNumber || "").trim() !== "" &&
    (formData?.customerName || "").trim() !== "";

  // Initialize the Redux dispatch function
  const dispatch = useDispatch();

  // Provide default values for form data to handle undefined cases
  const safeFormData = {
    customerName: formData?.customerName || "", // Default to an empty string if undefined
    customerNumber: formData?.customerNumber || "", // Default to an empty string if undefined
    notes: formData?.notes || "", // Default to an empty string if undefined
  };

  return (
    <div>
      {/* Form container */}
      <form className="space-y-3">
        {/* Input field for customer name */}
        <input
          type="text"
          placeholder="Customer Name"
          value={safeFormData.customerName}
          onChange={(e) =>
            dispatch(updateFormData({ customerName: e.target.value }))
          }
          className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-gray-100 placeholder-slate-400"
        />

        {/* Phone number input field using PhoneInput library */}
        <PhoneInput
          country={"lk"} // Default country code (Sri Lanka)
          value={safeFormData.customerNumber}
          onChange={(phone) =>
            dispatch(updateFormData({ customerNumber: phone }))
          }
          enableAreaCodes={true} // Enable area codes
          enableLongNumbers={true} // Allow long numbers
          disableCountryCode={false} // Allow editing of the country code
          countryCodeEditable={false} // Prevent editing of the country code
          inputClass="!w-full !p-2 !pl-12 !border !border-slate-600 !rounded !bg-slate-700 !text-gray-100 !placeholder-slate-400"
          buttonClass="!bg-slate-700 !border-slate-600"
          containerClass="!bg-slate-700"
          dropdownClass="!bg-slate-700 !text-gray-100 !border !border-slate-600 !shadow-md"
          searchClass="!bg-slate-800 !text-gray-100"
          placeholder="Phone Number"
        />

        {/* Textarea for optional notes */}
        <textarea
          placeholder="Notes (Optional)"
          value={safeFormData.notes}
          onChange={(e) => dispatch(updateFormData({ notes: e.target.value }))}
          className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-gray-100 placeholder-slate-400"
        />

        {/* Button to proceed to the next step */}
        <button
          type="button"
          onClick={onNext} // Trigger the onNext callback when clicked
          disabled={!isFormValid} // Disable the button if the form is invalid
          className={`w-full px-4 py-2 rounded text-white ${
            isFormValid
              ? "bg-slate-900 hover:bg-slate-700 cursor-pointer" // Enabled button styles
              : "bg-slate-600 cursor-not-allowed" // Disabled button styles
          }`}
        >
          Next
        </button>
      </form>
    </div>
  );
};

// Export the CustomerForm component for use in other parts of the application
export default CustomerForm;
