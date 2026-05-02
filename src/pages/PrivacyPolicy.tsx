import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "phosphor-react";

const PrivacyPolicy = () => {
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
            <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: May 2026</p>

            <div className="space-y-8 text-foreground">

              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">1. Introduction</h2>
                <p className="mb-4">
                  In Focus Operations Limited ("we", "us", or "our") is committed to data security and the fair and transparent processing of
                  personal data. This Privacy Policy sets out how we collect, store, use, and share personal data in connection with the ivangel
                  service, in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </p>
                <p className="mb-4">
                  In Focus Operations Limited is a company registered in England and Wales with company number 16707659, whose registered address
                  is 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE. For the purposes of the UK GDPR, In Focus Operations Limited is
                  the data controller in respect of the personal data you provide to us.
                </p>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a> or
                  write to: Data Protection Officer, In Focus Operations Limited, 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE.
                </p>
              </section>

              {/* What data we collect */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">2. What Personal Data We Collect</h2>

                <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
                <p className="mb-4">When you create an account or use the Service, we collect:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Your name and email address</li>
                  <li>Your church name, address, website URL, denomination, and contact email</li>
                  <li>Service times, social media handles, key ministries, and vision statement</li>
                  <li>Sermon transcripts or other text-based materials you upload</li>
                  <li>Any feedback, support requests, or other correspondence you send us</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information Collected Automatically</h3>
                <p className="mb-4">When you use the Service, we automatically collect:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Technical information: IP address, browser type and version, operating system</li>
                  <li>Usage data: pages viewed, features used, content generated, and interaction patterns</li>
                  <li>Device identifiers and session tokens for authentication</li>
                  <li>Internal usage metrics: the number of AI tokens consumed and estimated cost per generation (used for cost management; not shared with you)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Data Collected During Onboarding</h3>
                <p className="mb-4">
                  During onboarding, we crawl your church's publicly accessible website using Firecrawl to extract information about your church's
                  tone, style, theological emphasis, and communications approach. This data is used to build your church's voice profile, which
                  personalises the content ivangel generates for you. We store the date and time of the last crawl. Only publicly available
                  web pages are accessed.
                </p>
              </section>

              {/* How we use your data */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">3. How We Use Your Personal Data</h2>

                <h3 className="text-xl font-semibold mb-3">Contract Performance</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>To provide the ivangel Service and generate content from your uploaded materials</li>
                  <li>To process your subscription and manage billing via Paddle</li>
                  <li>To communicate with you about your account and the Service</li>
                  <li>To provide customer support</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-4">Legitimate Interests</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Improving the quality and relevance of the Service</li>
                  <li>Analysing usage patterns to enhance features</li>
                  <li>Detecting and preventing fraud or abuse</li>
                  <li>Managing our business operations</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-4">Consent</h3>
                <p className="mb-4">
                  Where you have given express consent, we may send you newsletters, marketing communications, or updates about new features.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-4">Legal Obligations</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Complying with legal and regulatory requirements</li>
                  <li>Responding to lawful requests from authorities</li>
                  <li>Enforcing our Terms of Service</li>
                </ul>
              </section>

              {/* Third parties */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">4. Who We Share Your Data With</h2>
                <p className="mb-4">We share your data with the following third-party service providers:</p>

                <div className="space-y-4 mb-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Anthropic (AI Content Generation)</p>
                    <p className="text-sm text-muted-foreground">
                      Your sermon transcripts, church profile, and style guide data are sent to Anthropic's Claude API to generate content.
                      Anthropic is based in the United States. Data is transferred under appropriate safeguards.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Google Cloud (Translation)</p>
                    <p className="text-sm text-muted-foreground">
                      All generated content that you request in languages other than English is sent to the Google Cloud Translation API.
                      Google processes this data in accordance with their privacy policies.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Firecrawl (Website Scraping)</p>
                    <p className="text-sm text-muted-foreground">
                      During onboarding, your church's public website URL is passed to Firecrawl, which crawls publicly available pages to
                      help build your voice profile. Only public pages are accessed.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Paddle (Payments)</p>
                    <p className="text-sm text-muted-foreground">
                      Paddle processes subscription payments on our behalf. Your email address and subscription details are shared with
                      Paddle to manage billing and payment processing. Paddle is the merchant of record for all transactions.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Supabase (Database and Hosting)</p>
                    <p className="text-sm text-muted-foreground">
                      All application data is stored in Supabase, hosted in the EU West (London) region. Supabase provides the database,
                      authentication, and server-side processing infrastructure for ivangel.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-1">Vercel (Frontend Hosting and Analytics)</p>
                    <p className="text-sm text-muted-foreground">
                      The ivangel web application is hosted on Vercel. We also use Vercel Analytics to collect privacy-friendly usage
                      statistics — page views and feature interactions. Vercel Analytics does not use cross-site tracking cookies or
                      fingerprinting.
                    </p>
                  </div>
                </div>

                <p className="mb-4">
                  We also share data with professional advisers (accountants, lawyers, insurers) and government authorities where required by
                  law. We do not sell your personal data to third parties.
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">5. Cookies and Tracking Technologies</h2>
                <p className="mb-4">
                  We use cookies and similar technologies to operate the Service and understand how it is used:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Essential Cookies (Supabase):</strong> Authentication tokens and session management cookies required for you to
                  log in and use the Service. These cannot be disabled without preventing access.</li>
                  <li><strong>Analytics (Vercel Analytics):</strong> Privacy-friendly analytics that track page views and feature usage.
                  Vercel Analytics does not use tracking cookies or store personally identifiable information.</li>
                  <li><strong>Functional Cookies:</strong> Preferences such as your selected theme or language settings.</li>
                </ul>
                <p className="mb-4">
                  You can control cookies through your browser settings. Disabling essential cookies will prevent you from using the Service.
                </p>
              </section>

              {/* Content Safety */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">6. Content Safety Screening</h2>
                <p className="mb-4">
                  Before your uploaded content is processed by our AI systems, it is automatically screened by our content safety system.
                  This checks for material that would be inappropriate for the Service (such as explicit or hateful content). Content that
                  fails these checks is not processed and is not sent to Anthropic. This screening is a necessary part of providing the Service.
                </p>
              </section>

              {/* Data retention */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">7. Data Retention</h2>
                <p className="mb-4">We retain your data as follows:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Account Information:</strong> Retained while your account is active and for up to 6 years after account closure
                  for legal and tax purposes.</li>
                  <li><strong>Sermon Transcripts:</strong> Stored in your account while it is active. You may delete transcripts at any time
                  within the Service, or request deletion by contacting us.</li>
                  <li><strong>Generated Content:</strong> Retained in your account while it is active. Upon account closure, content is
                  retained until you submit a deletion request to{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a>.</li>
                  <li><strong>Church Voice Profile:</strong> Your style guide and website-crawl data are stored while your account is active.
                  You may request deletion at any time.</li>
                  <li><strong>Payment Records:</strong> 6 years after the transaction date, for legal and tax compliance.</li>
                  <li><strong>Usage Analytics:</strong> Aggregated and anonymised analytics data may be retained for longer periods for
                  service improvement purposes.</li>
                </ul>
              </section>

              {/* Your rights */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">8. Your Rights</h2>
                <p className="mb-4">Under the UK GDPR, you have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data in certain circumstances. To exercise this right,
                  contact us at{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a>{" "}
                  with "Account Deletion" in the subject line. We will respond within one month.</li>
                  <li><strong>Right to Restrict Processing:</strong> Ask us to limit how we use your data in certain circumstances.</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests, including direct marketing.</li>
                  <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
                </ul>
                <p className="mb-4">
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a>.
                  We will respond within one month, though this may be extended in complex cases.
                </p>
              </section>

              {/* Data security */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">9. Data Security</h2>
                <p className="mb-4">
                  We implement appropriate technical and organisational measures to protect your data, including row-level security on our
                  database, encrypted connections (HTTPS), authentication controls, and access restrictions. All data at rest is stored in
                  Supabase's EU West region.
                </p>
                <p className="mb-4">
                  No method of internet transmission is 100% secure. While we strive to use commercially acceptable means to protect your
                  data, we cannot guarantee absolute security.
                </p>
              </section>

              {/* International transfers */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">10. International Data Transfers</h2>
                <p className="mb-4">
                  Your data may be transferred to and processed in countries outside the UK, in particular the United States, where Anthropic
                  (our AI provider) and Google Cloud (translation) are based. Where such transfers occur, we ensure appropriate safeguards are
                  in place, such as Standard Contractual Clauses approved by the UK Information Commissioner's Office.
                </p>
              </section>

              {/* Complaints */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">11. Complaints</h2>
                <p className="mb-4">
                  If you believe your data protection rights have been breached, you may lodge a complaint with the UK Information
                  Commissioner's Office (ICO) at{" "}
                  <a href="https://ico.org.uk/make-a-complaint/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    ico.org.uk/make-a-complaint
                  </a>{" "}
                  or by calling 0303 123 1113.
                </p>
                <p className="mb-4">
                  We encourage you to contact us first so we can resolve any concerns directly. We take data protection seriously and will
                  work to address any issues promptly.
                </p>
              </section>

              {/* Changes */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">12. Changes to This Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. Material changes will be communicated to you by email and/or by a
                  notice within the Service. The "Last updated" date at the top of this page indicates when the policy was last revised.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">13. Contact Us</h2>
                <div className="bg-muted p-6 rounded-lg mb-4">
                  <p className="mb-2"><strong>In Focus Operations Limited</strong></p>
                  <p className="mb-2">156 Russell Drive</p>
                  <p className="mb-2">Wollaton</p>
                  <p className="mb-2">Nottingham</p>
                  <p className="mb-2">England, NG8 2BE</p>
                  <p className="mb-2">Company Number: 16707659</p>
                  <p className="mb-2">
                    Email:{" "}
                    <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">
                      hello@infocusoperations.co.uk
                    </a>
                  </p>
                  <p className="mb-2">
                    Data Protection Officer:{" "}
                    <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">
                      hello@infocusoperations.co.uk
                    </a>{" "}
                    (mark subject "Data Protection")
                  </p>
                </div>
              </section>

              <section className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  In Focus Operations Limited Privacy Policy Version 1.0<br />
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

export default PrivacyPolicy;
