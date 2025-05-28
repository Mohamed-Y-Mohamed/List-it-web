// app/auth/verification/page.tsx
import { Suspense } from "react";
import EmailVerification from "@/components/verify/verify";

// Loading component for Suspense
function VerificationLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
    </div>
  );
}

// Verification page with Suspense boundary
export default function VerificationPage() {
  return (
    <Suspense fallback={<VerificationLoading />}>
      <EmailVerification />
    </Suspense>
  );
}
