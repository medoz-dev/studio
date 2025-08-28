
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This is the endpoint Lygos will call.
  // We will add the logic to handle the webhook here later.
  
  // For now, we just log that we received a request and return a success response.
  console.log("Received a webhook from Lygos.");
  
  try {
    const payload = await request.json();
    console.log("Payload:", payload);

    // TODO: 
    // 1. Verify the webhook signature using the Lygos webhook secret.
    // 2. Extract user information from the payload.
    // 3. Update the user's 'finAbonnement' date in Firestore.

    return NextResponse.json({ message: "Webhook received successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error processing Lygos webhook:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
