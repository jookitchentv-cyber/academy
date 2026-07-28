import { describe, it, expect } from 'vitest';
import { mergeSubjectsWithPlan } from './subjectsMap';

describe('mergeSubjectsWithPlan', () => {
  it('includes a subject that only has a plan and no actual entry yet', () => {
    const subjects = [];
    const plan = [{ subject: '국어', rawText: '2페이지 읽을 예정' }];
    const merged = mergeSubjectsWithPlan(subjects, plan);

    expect(merged).toEqual([
      { subject: '국어', percent: undefined, rawText: undefined, planText: '2페이지 읽을 예정' },
    ]);
  });

  it('merges plan and actual for the same subject', () => {
    const subjects = [{ subject: '수학', rawText: '쎈 1~10 풀었다', percent: 80 }];
    const plan = [{ subject: '수학', rawText: '쎈 1~10 풀 예정' }];
    const merged = mergeSubjectsWithPlan(subjects, plan);

    expect(merged).toEqual([
      { subject: '수학', percent: 80, rawText: '쎈 1~10 풀었다', planText: '쎈 1~10 풀 예정' },
    ]);
  });

  it('includes a subject that only has an actual entry and no plan', () => {
    const subjects = [{ subject: '영어', rawText: '본문 외웠다', percent: null }];
    const merged = mergeSubjectsWithPlan(subjects, []);

    expect(merged).toEqual([{ subject: '영어', percent: null, rawText: '본문 외웠다', planText: undefined }]);
  });

  it('orders subjects by the SUBJECTS constant, not input order', () => {
    const subjects = [{ subject: '수학', rawText: 'a', percent: null }];
    const plan = [{ subject: '국어', rawText: 'b' }];
    const merged = mergeSubjectsWithPlan(subjects, plan);
    expect(merged.map((s) => s.subject)).toEqual(['국어', '수학']);
  });

  it('drops the 기타 bucket (handled separately by callers)', () => {
    const subjects = [{ subject: '기타', rawText: 'stray text' }];
    const plan = [{ subject: '기타', rawText: 'stray plan' }];
    expect(mergeSubjectsWithPlan(subjects, plan)).toEqual([]);
  });

  it('returns an empty array when neither subjects nor plan have anything', () => {
    expect(mergeSubjectsWithPlan([], [])).toEqual([]);
    expect(mergeSubjectsWithPlan()).toEqual([]);
  });
});
