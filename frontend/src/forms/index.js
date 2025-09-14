// src/forms/index.js
import BaptismForm from "./BaptismForm.jsx";
import DefaultForm from "./DefaultForm.jsx";
// in future: import WeddingForm from "./WeddingForm.jsx"

export const formRegistry = {
  baptism: BaptismForm,
  wedding: DefaultForm, // temporary until you build WeddingForm
  confirmation: DefaultForm,
  confession: DefaultForm,
  anointing: DefaultForm,
  default: DefaultForm, // fallback
};

export default formRegistry;
