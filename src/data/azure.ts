export function getHeaders() {
  const subscriptionKey = process.env.AZURE_COGNITIVE_SERVICES_KEY;
  const subscriptionRegion = process.env.AZURE_COGNITIVE_SERVICES_REGION;

  return {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Ocp-Apim-Subscription-Region': subscriptionRegion,
  };
}
