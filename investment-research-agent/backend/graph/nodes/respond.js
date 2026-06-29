export async function respondNode(state) {
  // If there's an error, we don't need to format the final success response
  if (state.error) return {};

  // We could do additional formatting here if necessary, 
  // but the state already contains finalDecision which is what the frontend needs.
  return {};
}
