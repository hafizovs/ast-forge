import type { SamplePresetId } from '../../features/workbench/compiler.types';

export const DEFAULT_SOURCE = `let x = 10;
const y = 5;
let total = (x + y) * 2;

if (x > 5) {
  let z = 1;
  while (z < 3) {
    z = z + 1;
    total = total + z;
  }
} else {
  let z = 0;
  total = total - y;
}

let result = total / 2;
`;

export const SAMPLE_PRESETS: Record<SamplePresetId, string> = {
  default: DEFAULT_SOURCE,
  arith: `let a = 1 + 2 * 3 - 4 / 2;
`,
  ifelse: `let n = 4;
if (n > 2) {
  let ok = 1;
} else {
  let ok = 0;
}
`,
  while: `let i = 3;
while (i > 0) {
  i = i - 1;
}
`,
  nested: `let i = 2;
while (i > 0) {
  if (i == 2) {
    let x = 10;
  } else {
    let x = 1;
  }
  i = i - 1;
}
`,
  errors: `let x = ;
if (x > 1 {
  let y = 2;
`,
};

export const PRESET_IDS: SamplePresetId[] = [
  'default',
  'arith',
  'ifelse',
  'while',
  'nested',
  'errors',
];
