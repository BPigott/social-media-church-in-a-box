import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "phosphor-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-2">Refund Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: May 2026</p>

            <div className="space-y-8 text-foreground">

              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">1. Overview</h2>
                <p className="mb-4">
                  This Refund Policy explains your rights regarding cancellations and refunds for your ivangel subscription, operated by
                  In Focus Operations Limited (Company No. 16707659), 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE.
                </p>
                <p className="mb-4">
                  All payments are processed by Stripe. In Focus Operations Limited is the merchant of record for ivangel subscriptions.
                </p>
              </section>

              {/* Free Trial */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">2. Free Trial</h2>
                <p className="mb-4">
                  ivangel offers a 14-day free trial with no credit card required. You will not be charged during the trial period. If you
                  choose not to subscribe at the end of your trial, no payment will be taken and your account access will be restricted.
                </p>
                <p className="mb-4">
                  To cancel during your free trial, simply do not subscribe when prompted at the end of your trial period. Alternatively,
                  you may contact us at{" "}
                  <a href="mailto:support@ivangel.co" className="text-primary hover:underline">support@ivangel.co</a> and we will confirm
                  your trial has ended without charge.
                </p>
              </section>

              {/* Right to cancel - cooling off */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">3. Statutory Cooling-Off Period (14 Days)</h2>
                <p className="mb-4">
                  Under the UK Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, if you are a
                  consumer (an individual acting for purposes outside your trade, business, craft, or profession), you have the right to
                  cancel your subscription within <strong>14 days</strong> of the date you entered into the contract and receive a full refund.
                </p>
                <p className="mb-4">
                  If you have used the Service during the cooling-off period, we may deduct an amount proportionate to the service received
                  before cancellation, in accordance with UK consumer law.
                </p>
                <p className="mb-4">
                  To exercise your right to cancel during the cooling-off period, notify us clearly by:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Email: <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a> with "Cooling-Off Cancellation" in the subject line</li>
                  <li>Post: In Focus Operations Limited, 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE</li>
                </ul>
                <p className="mb-4">
                  Refunds under the cooling-off period will be processed to your original payment method within 14 business days.
                </p>
              </section>

              {/* Standard cancellation */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">4. Cancellation After the Cooling-Off Period</h2>
                <p className="mb-4">
                  You may cancel your ivangel subscription at any time. To cancel:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Go to <strong>Settings → Billing</strong> within your ivangel account and follow the cancellation steps</li>
                  <li>Or email us at <a href="mailto:support@ivangel.co" className="text-primary hover:underline">support@ivangel.co</a> and we will cancel on your behalf</li>
                </ul>
                <p className="mb-4">
                  Cancellation takes effect at the end of your current billing period. You will continue to have full access to the Service
                  until that date. Your subscription will not automatically renew after cancellation.
                </p>
                <p className="mb-4">
                  After the 14-day cooling-off period has expired, we do not provide refunds for partially used subscription periods.
                  You will retain access until the end of the period you have paid for.
                </p>
              </section>

              {/* Exceptions */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">5. Refunds Outside the Cooling-Off Period</h2>
                <p className="mb-4">
                  Refunds after the cooling-off period may be considered in the following exceptional circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>We materially breach these Terms of Service and fail to remedy the breach within a reasonable time after being notified</li>
                  <li>We discontinue the Service without providing a reasonable alternative or sufficient notice</li>
                  <li>You cancel as a direct result of a price increase (as notified under our 30-day notice obligation) and have not used
                  the Service since the new price took effect</li>
                  <li>At our sole discretion, in other exceptional circumstances</li>
                </ul>
                <p className="mb-4">
                  To request a refund in these circumstances, contact us at{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a>{" "}
                  with full details. Refunds, where approved, will be processed to the original payment method within 14 business days.
                </p>
              </section>

              {/* Failed payments */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">6. Failed Payments</h2>
                <p className="mb-4">
                  If a subscription payment fails (for example, due to an expired card or insufficient funds), we will attempt to process
                  the payment again. If payment continues to fail, your account may be suspended until payment is successfully processed.
                  You are responsible for keeping your payment information up to date.
                </p>
              </section>

              {/* Data after cancellation */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">7. Your Data After Cancellation</h2>
                <p className="mb-4">
                  After your subscription ends, your account and generated content will be retained. To request permanent deletion of your
                  account and all associated data, contact us at{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a>{" "}
                  with "Account Deletion" in the subject line. Please refer to our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for full details.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">8. Contact Us</h2>
                <p className="mb-4">For any questions about cancellations or refunds, please contact us:</p>
                <div className="bg-muted p-6 rounded-lg mb-4">
                  <p className="mb-2"><strong>In Focus Operations Limited</strong></p>
                  <p className="mb-2">156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE</p>
                  <p className="mb-2">Company Number: 16707659</p>
                  <p className="mb-2">
                    General enquiries:{" "}
                    <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">
                      hello@infocusoperations.co.uk
                    </a>
                  </p>
                  <p className="mb-2">
                    Support:{" "}
                    <a href="mailto:support@ivangel.co" className="text-primary hover:underline">
                      support@ivangel.co
                    </a>
                  </p>
                </div>
              </section>

              <section className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  In Focus Operations Limited Refund Policy Version 1.0<br />
                  Last updated: May 2026<br />
                  © 2026 In Focus Operations Limited. All rights reserved.
                </p>
              </section>

            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Button asChild>
              <Link to="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
