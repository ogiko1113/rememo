import { reviewCard, createDefaultCard, scoreToQuality } from '../index';

describe('SM-2 SRS Engine', () => {
  const baseCard = { id: 'test-card-1', easiness_factor: 2.5, interval: 0, repetitions: 0 };

  describe('reviewCard', () => {
    it('should reset on quality < 3', () => {
      const card = { ...baseCard, repetitions: 3, interval: 15 };
      const result = reviewCard(card, 2);
      expect(result.new_repetitions).toBe(0);
      expect(result.new_interval).toBe(1);
    });

    it('should set interval=1 on first success', () => {
      const result = reviewCard(baseCard, 4);
      expect(result.new_repetitions).toBe(1);
      expect(result.new_interval).toBe(1);
    });

    it('should set interval=6 on second success', () => {
      const card = { ...baseCard, repetitions: 1, interval: 1 };
      const result = reviewCard(card, 4);
      expect(result.new_repetitions).toBe(2);
      expect(result.new_interval).toBe(6);
    });

    it('should multiply interval by EF on subsequent success', () => {
      const card = { ...baseCard, repetitions: 2, interval: 6 };
      const result = reviewCard(card, 4);
      expect(result.new_repetitions).toBe(3);
      expect(result.new_interval).toBe(15);
    });

    it('should not go below min EF (1.3)', () => {
      const card = { ...baseCard, easiness_factor: 1.3 };
      const result = reviewCard(card, 0);
      expect(result.new_easiness_factor).toBe(1.3);
    });

    it('should increase EF on quality=5', () => {
      const result = reviewCard(baseCard, 5);
      expect(result.new_easiness_factor).toBe(2.6);
    });

    it('should clamp quality to 0-5', () => {
      expect(reviewCard(baseCard, -1).quality).toBe(0);
      expect(reviewCard(baseCard, 7).quality).toBe(5);
    });

    it('should handle all quality values (0-5)', () => {
      for (let q = 0; q <= 5; q++) {
        const result = reviewCard(baseCard, q);
        expect(result.quality).toBe(q);
        expect(result.new_easiness_factor).toBeGreaterThanOrEqual(1.3);
        expect(result.new_interval).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('createDefaultCard', () => {
    it('should create card with default values', () => {
      const card = createDefaultCard('user-1', 'unit-1');
      expect(card.easiness_factor).toBe(2.5);
      expect(card.interval).toBe(0);
      expect(card.repetitions).toBe(0);
      expect(card.last_reviewed_at).toBeNull();
    });
  });

  describe('scoreToQuality', () => {
    it('should map scores correctly', () => {
      expect(scoreToQuality(95)).toBe(5);
      expect(scoreToQuality(80)).toBe(4);
      expect(scoreToQuality(65)).toBe(3);
      expect(scoreToQuality(50)).toBe(2);
      expect(scoreToQuality(25)).toBe(1);
      expect(scoreToQuality(10)).toBe(0);
    });
  });
});
