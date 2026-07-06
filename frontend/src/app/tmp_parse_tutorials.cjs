const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(__dirname, 'data', 'tutorialContent.ts'), 'utf8');
const start = text.indexOf('export const mainTutorials');
if (start === -1) throw new Error('mainTutorials not found');
const eq = text.indexOf('=', start);
const arrStart = text.indexOf('[', eq);
if (arrStart === -1) throw new Error('array start not found');
let depth = 0;
let inStr = null;
let end = -1;
for (let i = arrStart; i < text.length; i++) {
  const c = text[i];
  if (inStr) {
    if (c === '\\') { i++; continue; }
    if (c === inStr) { inStr = null; }
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
  if (c === '[') { depth++; continue; }
  if (c === ']') { depth--; if (depth === 0) { end = i; break; }}
}
if (end === -1) throw new Error('array end not found');
const arrText = text.slice(arrStart, end + 1);
const expected = [];
let i = 0;
while (i < arrText.length) {
  if (arrText[i] === '{') {
    let depth = 0;
    let inStr = null;
    let startObj = i;
    let j = i;
    while (j < arrText.length) {
      const c = arrText[j];
      if (inStr) {
        if (c === '\\') { j += 2; continue; }
        if (c === inStr) { inStr = null; }
      } else {
        if (c === '"' || c === "'" || c === '`') { inStr = c; }
        else if (c === '{') { depth++; }
        else if (c === '}') {
          depth--;
          if (depth === 0) {
            const obj = arrText.slice(startObj, j + 1);
            const stepIdMatch = obj.match(/id\s*:\s*'([^']+)'/);
            if (stepIdMatch) {
              const stepId = stepIdMatch[1];
              expected.push(`tutorial.steps.${stepId}.title`);
              expected.push(`tutorial.steps.${stepId}.description`);
              const secArrayMatch = obj.match(/sections\s*:\s*\[([\s\S]*?)\]\s*(,|\})/);
              if (secArrayMatch) {
                const secBody = secArrayMatch[1];
                let k = 0;
                while (k < secBody.length) {
                  if (secBody[k] === '{') {
                    let secDepth = 0;
                    let secInStr = null;
                    let startSec = k;
                    let l = k;
                    while (l < secBody.length) {
                      const cc = secBody[l];
                      if (secInStr) {
                        if (cc === '\\') { l += 2; continue; }
                        if (cc === secInStr) { secInStr = null; }
                      } else {
                        if (cc === '"' || cc === "'" || cc === '`') { secInStr = cc; }
                        else if (cc === '{') { secDepth++; }
                        else if (cc === '}') {
                          secDepth--;
                          if (secDepth === 0) {
                            const sec = secBody.slice(startSec, l + 1);
                            const secIdMatch = sec.match(/id\s*:\s*'([^']+)'/);
                            if (secIdMatch) {
                              const secId = secIdMatch[1];
                              expected.push(`tutorial.steps.${stepId}.sections.${secId}.title`);
                              expected.push(`tutorial.steps.${stepId}.sections.${secId}.content`);
                              if (/action\s*:\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')/.test(sec)) {
                                expected.push(`tutorial.steps.${stepId}.sections.${secId}.action`);
                              }
                            }
                            k = l;
                            break;
                          }
                        }
                      }
                      l++;
                    }
                  }
                  k++;
                }
              }
            }
            i = j;
            break;
          }
        }
      }
      j++;
    }
  }
  i++;
}
fs.writeFileSync(path.join(__dirname, 'frontend_expected_tutorial_keys.json'), JSON.stringify(expected, null, 2), 'utf8');
console.log('WROTE', expected.length, 'keys');
