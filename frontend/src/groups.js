// Groups symptoms by body area so 130+ symptoms stay browsable.
// First matching rule wins; anything unmatched goes to "Other".
const RULES = [
  ["Skin", ["skin", "rash", "itch", "pimple", "blackhead", "scurring", "peeling", "blister", "nodal", "patches", "silver", "dusting", "pus_filled", "red_sore", "yellow_crust", "bruising", "ulcers_on_tongue"]],
  ["Head and nerves", ["headache", "dizz", "balance", "vision", "visual", "unsteadiness", "spinning", "weakness_of_one", "slurred", "coma", "altered_sensorium", "lack_of_concentration", "depression", "irritability", "anxiety", "mood", "restless", "stiff_neck", "loss_of_smell", "movement_stiffness", "pain_behind_the_eyes", "sunken_eyes", "redness_of_eyes", "watering_from_eyes"]],
  ["Chest and breathing", ["cough", "breath", "chest", "phlegm", "mucoid", "blood_in_sputum", "rusty", "palpitation", "fast_heart", "throat", "sneez", "runny", "congestion", "sinus", "continuous_sneezing", "swelled_lymph"]],
  ["Stomach and digestion", ["stomach", "abdominal", "nausea", "vomit", "diarr", "constipation", "acidity", "indigestion", "belly", "passage_of_gases", "stool", "anal", "bowel", "appetite", "swelling_of_stomach", "distention", "internal_itching", "ulcers"]],
  ["Urine and kidney", ["urine", "urin", "micturition", "bladder", "dark_urine", "yellow_urine", "polyuria"]],
  ["Muscles and joints", ["joint", "muscle", "knee", "hip", "back_pain", "neck_pain", "cramps", "swelling_joints", "painful_walking", "stiff", "weakness_in_limbs", "swollen_legs", "swollen_blood_vessels", "prominent_veins", "calf"]],
  ["Fever and general", ["fever", "chills", "sweat", "fatigue", "lethargy", "malaise", "weight", "hunger", "thirst", "dehydration", "shivering", "cold_hands", "toxic", "obesity", "swollen_extremeties", "puffy", "yellowing", "yellowish", "sugar", "enlarged_thyroid", "brittle", "abnormal_menstruation", "family_history", "history_of_alcohol"]],
];

export function groupOf(id) {
  for (const [name, keys] of RULES) {
    if (keys.some((k) => id.includes(k))) return name;
  }
  return "Other";
}

export const GROUP_ORDER = [...RULES.map((r) => r[0]), "Other"];
