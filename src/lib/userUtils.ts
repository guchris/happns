/**
 * Extracts the initials from a full name.
 * Splits the name into first and last name, taking the first character from each.
 * If there is no last name, only the first character of the first name is returned.
 * 
 * @param name - The full name of the user, typically including a first and last name.
 * @returns {string} - A string containing the initials, e.g., "JD" for "John Doe".
 */
export function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}