/**
 * A mock counts as analysed once any of the three written fields is filled.
 * Derived rather than stored — a separate flag would be one more thing to keep
 * in sync, and the plan's rule is about the writing existing, not a checkbox.
 */
export function isAnalysed(mock) {
  return !!(mock.key_mistakes?.trim() || mock.strategy_notes?.trim() || mock.time_analysis?.trim());
}
