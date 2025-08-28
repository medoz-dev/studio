

// Basic mapping of numbers to words
const numberWords: { [key: string]: number } = {
    'zéro': 0, 'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9,
    'dix': 10, 'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15, 'seize': 16,
    'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
    'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'soixante': 60,
    'soixante-dix': 70, 'quatre-vingt': 80, 'quatre-vingt-dix': 90,
    'cent': 100, 'mille': 1000
};

/**
 * Parses a French spoken number string into a number.
 * Handles simple numbers and some compound forms.
 * Example: "vingt cinq" -> 25, "quatre-vingt-douze" -> 92
 * @param text The spoken number string.
 * @returns The parsed number, or null if it can't be parsed.
 */
export function parseSpokenNumber(text: string): number | null {
    // First, try direct parsing of digits
    const numeric = parseFloat(text.replace(',', '.'));
    if (!isNaN(numeric)) {
        return numeric;
    }

    // Then, try parsing words
    const words = text.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 0) return null;

    let total = 0;
    let current = 0;

    for (const word of words) {
        if (word in numberWords) {
            const value = numberWords[word];
            if (value === 100) {
                current *= value;
            } else {
                current += value;
            }
        } else if (word === 'et') {
            continue;
        } else if (word.endsWith('s')) { // handle plural like 'vingts'
             const singularWord = word.slice(0, -1);
             if (singularWord in numberWords) {
                 const value = numberWords[singularWord];
                 current += value;
             }
        }
        else {
            // If a word is not a known number, parsing fails
            return null;
        }
    }
    total += current;
    
    return total > 0 || (words.length > 0 && words.includes('zéro')) ? total : null;
}


/**
 * Converts a number to its French word representation (simplified).
 * @param num The number to convert.
 * @returns The number as a string of French words.
 */
export function numberToWords(num: number): string {
    // This is a simplified version. For full fidelity, a more complex library would be needed.
    // For now, we can just reverse the map for simple numbers.
    const reversedMap = Object.fromEntries(Object.entries(numberWords).map(([key, value]) => [value, key]));
    if (num in reversedMap) {
        return reversedMap[num];
    }
    return String(num); // Fallback to digits
}
