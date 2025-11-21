export async function GET() {
  return new Response(
    JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      FCM_PROJECT_ID: process.env.FCM_PROJECT_ID ?? null,
      FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL ?? null,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? null,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
}
