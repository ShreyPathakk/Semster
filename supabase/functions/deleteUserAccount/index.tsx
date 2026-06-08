// supabase/functions/deleteUserAccount/index.ts

// Import Deno's serve function.
import { serve } from "https://deno.land/std@0.167.0/http/server.ts";
// Import the Supabase client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get environment variables (make sure these are set in your project configuration)
const supabaseUrl = 'https://zlikozbrfvqraxtywcco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWtvemJyZnZxcmF4dHl3Y2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzMyNDcsImV4cCI6MjA1MDUwOTI0N30.izwOCKFJQz59PViAVOrAinTtmdysVQ2v4PqqAEWBCvo';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

// Create an admin Supabase client using the service role key.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log("deleteUserAccount function loaded.");

// This function expects a POST request with a JSON body containing { "userId": "<user-id>" }.
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  try {
    // Parse the JSON body from the request.
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the user's public profile.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) throw new Error(profileError.message);

    // Delete the user's authentication record.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    // Return success response.
    return new Response(JSON.stringify({ message: "Account deleted successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error deleting account:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
