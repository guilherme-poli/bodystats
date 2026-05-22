export interface Skinfolds {
  triceps: number;
  subscapular: number;
  suprailiac: number;
  abdominal: number;
  midaxillary: number;
  chest: number;
  thigh: number;
}

export interface CalculationResult {
  bodyDensity: number;
  bodyFatPercent: number;
  fatMass: number;
  leanMass: number;
}

export function calculateJacksonPollock7(
  age: number,
  gender: "M" | "F",
  weight: number,
  skinfolds: Skinfolds
): CalculationResult {
  const sum =
    skinfolds.triceps +
    skinfolds.subscapular +
    skinfolds.suprailiac +
    skinfolds.abdominal +
    skinfolds.midaxillary +
    skinfolds.chest +
    skinfolds.thigh;

  let bodyDensity = 0;

  if (gender === "M") {
    bodyDensity =
      1.112 -
      0.00043499 * sum +
      0.00000055 * Math.pow(sum, 2) -
      0.00028826 * age;
  } else {
    bodyDensity =
      1.097 -
      0.00046971 * sum +
      0.00000056 * Math.pow(sum, 2) -
      0.00012828 * age;
  }

  // Siri Formula for body fat percentage
  let bodyFatPercent = (4.95 / bodyDensity - 4.5) * 100;

  // Clamp values to realistic ranges (0% to 100%)
  bodyFatPercent = Math.max(0, Math.min(100, bodyFatPercent));

  const fatMass = weight * (bodyFatPercent / 100);
  const leanMass = weight - fatMass;

  return {
    bodyDensity: parseFloat(bodyDensity.toFixed(5)),
    bodyFatPercent: parseFloat(bodyFatPercent.toFixed(1)),
    fatMass: parseFloat(fatMass.toFixed(2)),
    leanMass: parseFloat(leanMass.toFixed(2)),
  };
}
