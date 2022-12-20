/**
 * Find the n-th occurence of a substring
 *
 * @param {str} url The string to search in
 * @param {substr} url The substring to search for
 * @param {index} url Number of occurence
 */

export function getIndex(str, substr, index) {
    var Len = str.length, i = -1;
    while(index-- && i++ < Len) {
        i = str.indexOf(substr, i);
        if (i < 0) break;
    }
    return i;
}