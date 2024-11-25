export const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g; // Regex to match @username
    const mentions: string[] = [];
    let match;

    // Find all matches
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]); // Add the username (excluding @) to the list
    }

    return mentions;
};