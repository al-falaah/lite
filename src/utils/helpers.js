// src/utils/helpers.js

/**
 * Calculate age from a date of birth
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Format gender for display
 * @param {string} gender - Gender value ('male' or 'female')
 * @returns {string} Formatted gender with capital first letter
 */
export const formatGender = (gender) => {
  if (!gender) return '';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};