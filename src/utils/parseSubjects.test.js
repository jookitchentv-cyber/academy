import { describe, it, expect } from 'vitest';
import { parseSubjects } from './parseSubjects';

describe('parseSubjects', () => {
  it('splits the spec example paragraph into per-subject segments', () => {
    const text = '오늘은 국어 자습서 11p까지 하고 문제 10문제 풀었다. 수학은 쎈 53번부터 100번까지 풀었다.';
    const result = parseSubjects(text);

    expect(result).toEqual([
      { subject: '기타', rawText: '오늘은', percent: undefined },
      { subject: '국어', rawText: '자습서 11p까지 하고 문제 10문제 풀었다.', percent: null },
      { subject: '수학', rawText: '쎈 53번부터 100번까지 풀었다.', percent: null },
    ]);
  });

  it('parses a subject sentence that starts with the keyword directly', () => {
    const text = '수학 쎈 53페이지부터 100페이지까지 풀었다';
    expect(parseSubjects(text)).toEqual([
      { subject: '수학', rawText: '쎈 53페이지부터 100페이지까지 풀었다', percent: null },
    ]);
  });

  it('parses another direct-start example', () => {
    const text = '국어 자습서 11p까지 하고 문제 10개 풀었다';
    expect(parseSubjects(text)).toEqual([
      { subject: '국어', rawText: '자습서 11p까지 하고 문제 10개 풀었다', percent: null },
    ]);
  });

  it('bucket entire text under 기타 when no subject keyword is found', () => {
    const text = '오늘은 그냥 쉬었다';
    expect(parseSubjects(text)).toEqual([
      { subject: '기타', rawText: '오늘은 그냥 쉬었다', percent: undefined },
    ]);
  });

  it('merges duplicate mentions of the same subject', () => {
    const text = '수학 쎈 10페이지 풀었다. 국어 자습서 5페이지 풀었다. 수학 오답노트도 정리했다.';
    const result = parseSubjects(text);
    const math = result.find((s) => s.subject === '수학');
    expect(math.rawText).toBe('쎈 10페이지 풀었다. 오답노트도 정리했다.');
    expect(result.map((s) => s.subject)).toEqual(['수학', '국어']);
  });

  it('returns an empty array for blank input', () => {
    expect(parseSubjects('')).toEqual([]);
    expect(parseSubjects('   ')).toEqual([]);
  });

  it('prefers the longer keyword when one subject name is a prefix concern', () => {
    const text = '한국사 근현대사 부분을 정리했다';
    expect(parseSubjects(text)).toEqual([
      { subject: '한국사', rawText: '근현대사 부분을 정리했다', percent: null },
    ]);
  });
});
