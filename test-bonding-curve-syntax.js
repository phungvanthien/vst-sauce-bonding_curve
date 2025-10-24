// Test BondingCurve component syntax
const fs = require('fs');

try {
  const content = fs.readFileSync('./src/components/BondingCurve.tsx', 'utf8');
  
  // Check for common syntax errors
  const errors = [];
  
  // Check for unmatched brackets
  const openBrackets = (content.match(/\{/g) || []).length;
  const closeBrackets = (content.match(/\}/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched brackets');
  }
  
  // Check for unmatched parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unmatched parentheses');
  }
  
  // Check for common syntax issues
  if (content.includes('undefined') && content.includes('data.hbarReceived')) {
    errors.push('Potential undefined hbarReceived issue');
  }
  
  if (errors.length > 0) {
    console.log('❌ Syntax issues found:');
    errors.forEach(error => console.log('  -', error));
  } else {
    console.log('✅ No obvious syntax errors found');
  }
  
  console.log('📊 File stats:');
  console.log('  Lines:', content.split('\n').length);
  console.log('  Characters:', content.length);
  console.log('  Open brackets:', openBrackets);
  console.log('  Close brackets:', closeBrackets);
  
} catch (error) {
  console.log('❌ Error reading file:', error.message);
}
