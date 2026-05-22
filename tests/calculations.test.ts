import { describe, it, expect } from "vitest";
import { calculateJacksonPollock7, Skinfolds } from "../src/lib/calculations";

describe("Jackson-Pollock 7-Fold Calculations", () => {
  it("should calculate correctly for a male user", () => {
    const age = 25;
    const gender = "M";
    const weight = 75;
    const skinfolds: Skinfolds = {
      triceps: 12,
      subscapular: 10,
      suprailiac: 15,
      abdominal: 18,
      midaxillary: 11,
      chest: 10,
      thigh: 14,
    };

    const result = calculateJacksonPollock7(age, gender, weight, skinfolds);

    // Sum of skinfolds = 90
    // Density calculation:
    // bodyDensity = 1.112 - 0.00043499 * 90 + 0.00000055 * (90^2) - 0.00028826 * 25
    // bodyDensity = 1.112 - 0.0391491 + 0.004455 - 0.0072065 = 1.07010
    expect(result.bodyDensity).toBe(1.0701);
    
    // bodyFatPercent = (4.95 / 1.0701 - 4.5) * 100 = 12.5738... => 12.6%
    expect(result.bodyFatPercent).toBe(12.6);
    
    // fatMass = 75 * 0.125738... = 9.43 kg
    expect(result.fatMass).toBe(9.43);
    
    // leanMass = 75 - 9.43 = 65.57 kg
    expect(result.leanMass).toBe(65.57);
  });

  it("should calculate correctly for a female user", () => {
    const age = 30;
    const gender = "F";
    const weight = 60;
    const skinfolds: Skinfolds = {
      triceps: 15,
      subscapular: 14,
      suprailiac: 18,
      abdominal: 20,
      midaxillary: 12,
      chest: 11,
      thigh: 16,
    };

    const result = calculateJacksonPollock7(age, gender, weight, skinfolds);

    // Sum of skinfolds = 106
    // Density calculation:
    // bodyDensity = 1.097 - 0.00046971 * 106 + 0.00000056 * (106^2) - 0.00012828 * 30
    // bodyDensity = 1.097 - 0.04978926 + 0.00629216 - 0.0038484 = 1.04965
    expect(result.bodyDensity).toBe(1.04965);
    
    // bodyFatPercent = (4.95 / 1.04965 - 4.5) * 100 = 21.5837... => 21.6%
    expect(result.bodyFatPercent).toBe(21.6);
    
    // fatMass = 60 * 0.21583... = 12.95 kg
    expect(result.fatMass).toBe(12.95);
    
    // leanMass = 60 - 12.95 = 47.05 kg
    expect(result.leanMass).toBe(47.05);
  });

  it("should clamp body fat percentage between 0% and 100%", () => {
    // Test case with extremely low/unrealistic skinfolds resulting in negative/invalid values
    const age = 18;
    const gender = "M";
    const weight = 70;
    const skinfolds: Skinfolds = {
      triceps: 1,
      subscapular: 1,
      suprailiac: 1,
      abdominal: 1,
      midaxillary: 1,
      chest: 1,
      thigh: 1,
    };

    const result = calculateJacksonPollock7(age, gender, weight, skinfolds);
    expect(result.bodyFatPercent).toBeGreaterThanOrEqual(0);
    expect(result.bodyFatPercent).toBeLessThanOrEqual(100);
  });
});
