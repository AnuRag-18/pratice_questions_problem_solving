function generatePascalsTriangle(numRows) {
  if (numRows === 0) {
    return [];
  }
  const triangle = [[1]];
  for (let i = 1; i < numRows; i++) {
    const prevRow = triangle[i - 1];
    const currentRow = [1];
    for (let j = 1; j < prevRow.length; j++) {
      currentRow.push(prevRow[j - 1] + prevRow[j]);
    }
    currentRow.push(1);
    triangle.push(currentRow);
  }

  return triangle;
}

const numRows = 5;
const pascalsTriangle = generatePascalsTriangle(numRows);

console.log(`Pascal's Triangle with ${numRows} rows:`);
pascalsTriangle.forEach(row => {
  console.log(row.join(' ')); 
});

console.log("\nReturn value as a 2D array:");
console.log(generatePascalsTriangle(5));
