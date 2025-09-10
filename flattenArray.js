
function flattenRecursively(arr) {
  const flattened = [];

  for (const element of arr) {
    if (Array.isArray(element)) {
      // If the element is an array, recursively call the function
      flattened.push(...flattenRecursively(element));
    } else {
      // Otherwise, push the element to the new array
      flattened.push(element);
    }
  }

  return flattened;
}

const nestedArray = [1, [2, 3], [4, [5, 6]]];
const flattenedArray = flattenRecursively(nestedArray);
console.log(flattenedArray); // Output: [1, 2, 3, 4, 5, 6]