'use strict';

const REGIONS = [
  {
    key:      'jaffna',
    label:    'Jaffna Peninsula',
    terms:    ['jaffna', 'northern province', 'northern sri lanka', 'vanni', 'kilinochchi', 'mannar', 'mullaitivu'],
    priority: 1,
    badge:    { bg: 'D6EAF8', fg: '154360' },
    ansi:     '\x1b[94m', // bright blue
  },
  {
    key:      'sri lanka',
    label:    'Sri Lanka',
    terms:    ['sri lanka', 'ceylon', 'colombo', 'kandy', 'galle', 'dry zone sri', 'wet zone sri'],
    priority: 2,
    badge:    { bg: 'D5F5E3', fg: '1D6A39' },
    ansi:     '\x1b[92m', // bright green
  },
  {
    key:      'asia',
    label:    'South Asia',
    terms:    ['india', 'bangladesh', 'pakistan', 'nepal', 'myanmar', 'south asia', 'southeast asia', 'south-east asia', 'asian'],
    priority: 3,
    badge:    { bg: 'FEF9E7', fg: '7D6608' },
    ansi:     '\x1b[93m', // yellow
  },
];

const GLOBAL_REGION = {
  key:      'global',
  label:    'Global',
  priority: 4,
  badge:    { bg: 'F5EEF8', fg: '6C3483' },
  ansi:     '\x1b[35m', // magenta
};

function detectStudyArea(title = '', abstract = '', venue = '') {
  const text = [title, abstract, venue].join(' ').toLowerCase();
  for (const region of REGIONS) {
    if (region.terms.some((t) => text.includes(t))) return region.label;
  }
  return GLOBAL_REGION.label;
}

function regionByLabel(label = '') {
  const l = label.toLowerCase();
  return REGIONS.find((r) => l.includes(r.key)) || GLOBAL_REGION;
}

function priority(label) {
  return regionByLabel(label).priority;
}

function badge(label) {
  return regionByLabel(label).badge;
}

function ansi(label) {
  return regionByLabel(label).ansi;
}

module.exports = { REGIONS, GLOBAL_REGION, detectStudyArea, regionByLabel, priority, badge, ansi };
