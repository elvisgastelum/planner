// Simplified CQRS spec: minimal test to verify module compiles.
// CQRS handlers are currently disabled; controller uses PlannerService directly.

describe('PlannerModule CQRS', () => {
  it('should have empty command and query handlers', () => {
    const { commandHandlers, queryHandlers } = require('./planner.cqrs');
    expect(commandHandlers).toEqual([]);
    expect(queryHandlers).toEqual([]);
  });
});
