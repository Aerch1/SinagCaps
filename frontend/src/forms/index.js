import BaptismForm from "./BaptismForm.jsx";
import ConfirmationForm from "./ConfirmationForm.jsx";
import DefaultForm from "./DefaultForm.jsx";
// Future: import WeddingForm from "./WeddingForm.jsx";

export const formRegistry = {
  baptism: BaptismForm,
  wedding: DefaultForm, // swap later with WeddingForm
  confirmation: ConfirmationForm, // ✅ now points to your new Kumpil form
  confession: DefaultForm,
  anointing: DefaultForm,
  funeral: DefaultForm,
  default: DefaultForm, // fallback
};

/**
 * Safe getter — returns a registered form component
 * or DefaultForm if no match exists.
 */
export function getFormComponent(formType = "default") {
  return formRegistry[formType] || formRegistry.default;
}

export default formRegistry;
