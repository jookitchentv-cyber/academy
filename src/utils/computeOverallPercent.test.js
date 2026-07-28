import { describe, it, expect } from 'vitest';
import { computeOverallPercent } from './computeOverallPercent';

describe('computeOverallPercent', () => {
  it('averages the spec example (국어 50 + 수학 100 -> 75)', () => {
    const subjects = [
      { subject: '국어', rawText: '', percent: 50 },
      { subject: '수학', rawText: '', percent: 100 },
    ];
    expect(computeOverallPercent(subjects)).toBe(75);
  });

  it('excludes unrated (null) subjects from the average', () => {
    const subjects = [
      { subject: '국어', rawText: '', percent: 50 },
      { subject: '수학', rawText: '', percent: null },
    ];
    expect(computeOverallPercent(subjects)).toBe(50);
  });

  it('returns null when nothing is rated', () => {
    const subjects = [
      { subject: '국어', rawText: '', percent: null },
      { subject: '수학', rawText: '', percent: null },
    ];
    expect(computeOverallPercent(subjects)).toBeNull();
  });

  it('returns null for an empty subjects list', () => {
    expect(computeOverallPercent([])).toBeNull();
  });

  it('rounds to one decimal place', () => {
    const subjects = [
      { subject: '국어', rawText: '', percent: 50 },
      { subject: '수학', rawText: '', percent: 60 },
      { subject: '영어', rawText: '', percent: 70 },
    ];
    expect(computeOverallPercent(subjects)).toBe(60);
  });
});
