// Simplified CQRS: empty arrays to disable CQRS for now.
// The controller injects PlannerService directly.
// This avoids compilation errors while the API surface is being normalized.

export const commandHandlers: any[] = [];
export const queryHandlers: any[] = [];
