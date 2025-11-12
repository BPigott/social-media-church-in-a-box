import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "phosphor-react";

const TermsOfService = () => {
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
            <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 2025</p>

            <div className="space-y-8 text-foreground">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Welcome to ivangel, an AI-powered content generation platform for churches operated by In Focus Operations Limited ("we", "us", or "our"). 
                  These Terms of Service ("Terms") govern your access to and use of the ivangel service, including our website, mobile applications, and 
                  all related services (collectively, the "Service").
                </p>
                <p className="mb-4">
                  By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you must not 
                  use the Service.
                </p>
                <p className="mb-4">
                  In Focus Operations Limited is a company registered in England and Wales with company number 16707659, whose registered address is 
                  156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE.
                </p>
              </section>

              {/* Definitions */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">2. Definitions</h2>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>"Service"</strong> means the ivangel platform and all associated features, including content generation, content library, 
                  style guide generation, and multi-language support.</li>
                  <li><strong>"User"</strong>, <strong>"you"</strong>, or <strong>"your"</strong> means any individual or organisation that accesses 
                  or uses the Service.</li>
                  <li><strong>"Content"</strong> means any text, data, information, or materials uploaded, generated, or stored through the Service.</li>
                  <li><strong>"Subscription"</strong> means the monthly subscription plan purchased to access the Service.</li>
                  <li><strong>"Free Trial"</strong> means the initial 10-day period during which new users can access the Service without payment.</li>
                </ul>
              </section>

              {/* Acceptance of Terms */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">3. Acceptance of Terms</h2>
                <p className="mb-4">
                  By creating an account, subscribing to the Service, or using any features of ivangel, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms and our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p className="mb-4">
                  If you are using the Service on behalf of an organisation (such as a church), you represent and warrant that you have the authority 
                  to bind that organisation to these Terms, and references to "you" and "your" will refer to both you and the organisation.
                </p>
                <p className="mb-4">
                  You must be at least 18 years old to use the Service. If you are under 18, you may only use the Service with the consent and 
                  supervision of a parent or legal guardian.
                </p>
              </section>

              {/* Service Description */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">4. Service Description</h2>
                <p className="mb-4">
                  ivangel provides an AI-powered platform that enables churches and religious organisations to generate various types of content from 
                  sermon transcripts or other text-based materials. The Service includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Social Media Posts:</strong> Platform-optimised content for Facebook, Instagram, TikTok, and Twitter/X, including 
                  character limit guidance and formatting recommendations.</li>
                  <li><strong>Bible Study Guides:</strong> Comprehensive study materials with discussion questions, application points, and 
                  downloadable resources for small groups.</li>
                  <li><strong>Daily Devotionals:</strong> Short, inspirational content suitable for daily social media posts, newsletters, or 
                  spiritual reflection materials.</li>
                  <li><strong>Multi-Language Support:</strong> Content generation and translation services for up to 22 languages.</li>
                  <li><strong>Content Library:</strong> Storage, organisation, search, and management tools for all generated content.</li>
                  <li><strong>Style Guide Generation:</strong> AI-powered analysis of your church's communication style, values, and theological 
                  perspective to ensure generated content aligns with your unique voice.</li>
                </ul>
                <p className="mb-4">
                  The Service is currently in beta. Features and functionality may change as we continue to improve the platform. We reserve the right 
                  to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
                </p>
              </section>

              {/* Subscription Terms */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">5. Subscription Terms</h2>
                <h3 className="text-xl font-semibold mb-3">5.1 Free Trial</h3>
                <p className="mb-4">
                  New users may be eligible for a free 10-day trial period ("Free Trial"). During the Free Trial, you will have full access to all 
                  features of the Service. To start your Free Trial, you must provide payment information (credit card, debit card, or other accepted 
                  payment method); however, no payment will be charged during the Free Trial period.
                </p>
                <p className="mb-4">
                  At the end of the Free Trial period, your subscription will automatically commence and you will be charged the Subscription Fee 
                  unless you cancel before the trial ends. You may cancel your Free Trial at any time during the trial period through your account 
                  settings or by contacting us at hello@infocusoperations.co.uk, and no charge will be made.
                </p>
                <p className="mb-4">
                  If you cancel your Free Trial or do not subscribe, your account access will be restricted, but your generated content will be retained 
                  for 30 days should you decide to subscribe later.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Subscription Plans</h3>
                <p className="mb-4">
                  The Service is available through a monthly subscription plan priced at £25 per month ("Subscription Fee"). The Subscription Fee is 
                  billed monthly in advance and provides unlimited content generation.
                </p>
                <p className="mb-4">
                  By subscribing, you agree to pay the Subscription Fee using the payment method you provide. You will be charged at the beginning of 
                  each monthly billing cycle, and your subscription will automatically renew unless cancelled in accordance with Section 7 below.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Price Changes</h3>
                <p className="mb-4">
                  We reserve the right to modify the Subscription Fee at any time. If we increase the price of your subscription, we will provide you 
                  with at least 30 days' notice before the change takes effect. If you do not wish to continue at the new price, you may cancel your 
                  subscription in accordance with Section 7 below.
                </p>
              </section>

              {/* User Accounts and Responsibilities */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">6. User Accounts and Responsibilities</h2>
                <h3 className="text-xl font-semibold mb-3">6.1 Account Creation</h3>
                <p className="mb-4">
                  To use the Service, you must create an account by providing accurate, current, and complete information. You are responsible for 
                  maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Account Security</h3>
                <p className="mb-4">
                  You are solely responsible for maintaining the security of your account and password. You must immediately notify us of any 
                  unauthorised use of your account or any breach of security. We will not be liable for any loss or damage arising from your failure 
                  to protect your account credentials.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Acceptable Use</h3>
                <p className="mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Use the Service in any way that violates any applicable law or regulation</li>
                  <li>Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, 
                  obscene, or otherwise objectionable</li>
                  <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                  <li>Attempt to gain unauthorised access to any portion of the Service, other accounts, or computer systems</li>
                  <li>Use automated systems (such as bots, spiders, or scrapers) to access the Service without our express written permission</li>
                  <li>Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without our express written permission</li>
                  <li>Use the Service to generate content that infringes upon the intellectual property rights of others</li>
                </ul>
                <p className="mb-4">
                  Violation of these acceptable use provisions may result in immediate termination of your account without refund.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.4 Fair Use Policy</h3>
                <p className="mb-4">
                  While we offer unlimited content generation as part of the Service, we reserve the right to monitor usage patterns and implement 
                  reasonable usage limits to ensure fair access for all users and to maintain service quality. Fair use includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Using the Service for its intended purpose: generating content for your church or religious organisation</li>
                  <li>Not engaging in excessive automated requests or usage that may impact service performance for other users</li>
                  <li>Not attempting to circumvent or bypass any usage limits or technical restrictions</li>
                  <li>Not using the Service in a manner that places an unreasonable burden on our infrastructure or resources</li>
                </ul>
                <p className="mb-4">
                  If we determine that your usage exceeds fair use limits or violates this policy, we reserve the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Request that you moderate your usage</li>
                  <li>Temporarily throttle or limit your access to certain features</li>
                  <li>Suspend or terminate your subscription immediately, without prior notice and without refund</li>
                </ul>
                <p className="mb-4">
                  We will typically attempt to contact you before taking action, except in cases of extreme abuse or violation of these Terms. Our 
                  determination of what constitutes fair use is final and at our sole discretion.
                </p>
              </section>

              {/* Content and Intellectual Property */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">7. Content and Intellectual Property</h2>
                <h3 className="text-xl font-semibold mb-3">7.1 Your Content</h3>
                <p className="mb-4">
                  You retain ownership of any content you upload to the Service, including sermon transcripts, church information, and other materials 
                  you provide ("Your Content"). By uploading Your Content, you grant us a limited, non-exclusive, worldwide, royalty-free licence to 
                  use, store, and process Your Content solely for the purpose of providing the Service to you.
                </p>
                <p className="mb-4">
                  You represent and warrant that you have all necessary rights, licences, and permissions to upload and use Your Content in connection 
                  with the Service, and that Your Content does not infringe upon the rights of any third party.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Generated Content</h3>
                <p className="mb-4">
                  All content generated by the Service ("Generated Content") is created using artificial intelligence and is based on the materials you 
                  provide. You own all rights, title, and interest in the Generated Content created through your use of the Service, subject to your 
                  compliance with these Terms.
                </p>
                <p className="mb-4">
                  While we strive to ensure Generated Content is accurate and appropriate, the Service uses AI technology that may occasionally produce 
                  errors or unexpected results. You are responsible for reviewing, editing, and approving all Generated Content before use. We do 
                  not guarantee that Generated Content will be error-free or suitable for your specific purposes.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Service Intellectual Property</h3>
                <p className="mb-4">
                  The Service, including its design, features, functionality, and underlying technology, is owned by In Focus Operations Limited or 
                  its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, 
                  or create derivative works based on the Service without our express written permission.
                </p>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">8. Payment Terms</h2>
                <h3 className="text-xl font-semibold mb-3">8.1 Payment Methods</h3>
                <p className="mb-4">
                  We accept payment through credit cards, debit cards, and other payment methods as may be made available. All payments must be made 
                  in British Pounds Sterling (£).
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">8.2 Billing Cycle</h3>
                <p className="mb-4">
                  Your subscription will automatically renew each month on the anniversary of your initial subscription date (or the date your Free Trial 
                  ended). You will be charged the Subscription Fee in advance for each monthly period.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Failed Payments</h3>
                <p className="mb-4">
                  If payment fails due to an expired card, insufficient funds, or any other reason, we will attempt to process the payment again. 
                  If payment continues to fail, we may suspend or terminate your access to the Service until payment is successfully processed.
                </p>
                <p className="mb-4">
                  You are responsible for ensuring that your payment information is current and accurate. You must update your payment method if it 
                  changes or expires.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">8.4 Refunds</h3>
                <p className="mb-4">
                  Refunds are handled in accordance with Section 9 (Cancellation and Refunds) below. Please note that under UK law, you have the right 
                  to a 14-day cooling-off period for new subscriptions under the Consumer Contracts Regulations 2013.
                </p>
              </section>

              {/* Cancellation and Refunds */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">9. Cancellation and Refunds</h2>
                <h3 className="text-xl font-semibold mb-3">9.1 Right to Cancel</h3>
                <p className="mb-4">
                  You may cancel your subscription at any time through your account settings or by contacting us at hello@infocusoperations.co.uk. 
                  Cancellation will take effect at the end of your current billing period. You will continue to have access to the Service until the 
                  end of the paid period.
                </p>
                <p className="mb-4">
                  Once you cancel, your subscription will not automatically renew, and you will lose access to the Service at the end of your current 
                  billing period. Your account and generated content will be retained for 30 days after cancellation, after which they may be deleted 
                  in accordance with our data retention policies.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">9.2 Cooling-Off Period</h3>
                <p className="mb-4">
                  Under the Consumer Contracts Regulations 2013, if you are a consumer (an individual acting for purposes outside your trade, business, 
                  craft, or profession), you have the right to cancel your subscription within 14 days of the date you entered into the contract 
                  ("Cooling-Off Period") and receive a full refund.
                </p>
                <p className="mb-4">
                  If you cancel during the Cooling-Off Period and have used the Service, we may deduct an amount from your refund that is proportionate 
                  to the service you have received before cancellation, in accordance with UK consumer law.
                </p>
                <p className="mb-4">
                  To exercise your right to cancel during the Cooling-Off Period, you must inform us of your decision to cancel by email to 
                  hello@infocusoperations.co.uk or by post to the address provided in Section 16 below.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">9.3 Refunds After Cooling-Off Period</h3>
                <p className="mb-4">
                  After the Cooling-Off Period has expired, refunds are generally not available except in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>If we materially breach these Terms and fail to remedy the breach within a reasonable time after being notified</li>
                  <li>If we discontinue the Service without providing a reasonable alternative</li>
                  <li>If you cancel due to a price increase (as set out in Section 5.3) and you have not used the Service since the price change</li>
                  <li>At our sole discretion, in exceptional circumstances</li>
                </ul>
                <p className="mb-4">
                  Refunds, where applicable, will be processed to the original payment method within 14 business days.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">9.4 No Refunds for Partially Used Periods</h3>
                <p className="mb-4">
                  Except as set out in Section 9.2 (Cooling-Off Period), we do not provide refunds or credits for any partially used subscription 
                  periods. If you cancel your subscription, you will continue to have access until the end of your current billing period, but you 
                  will not receive a refund for the unused portion.
                </p>
              </section>

              {/* Privacy Policy */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">10. Privacy Policy</h2>
                <p className="mb-4">
                  Your privacy is important to us. This section outlines how we collect, use, and protect your personal data. Our full Privacy Policy 
                  is incorporated into these Terms by reference.
                </p>

                <h3 className="text-xl font-semibold mb-3">10.1 Introduction</h3>
                <p className="mb-4">
                  In Focus Operations Limited is committed to data security and the fair and transparent processing of personal data. This privacy 
                  policy sets out how we will treat the personal data which you provide to us in compliance with applicable data protection law, in 
                  particular the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </p>
                <p className="mb-4">
                  Please read this section carefully as it contains important information on who we are, how and why we collect, store, use and share 
                  personal data, your rights in relation to your personal data, and how to contact us and supervisory authorities in the event that 
                  you would like to report a concern about the way in which we process your data.
                </p>
                <p className="mb-4">
                  If you have any queries about this Privacy Policy, please contact us at hello@infocusoperations.co.uk or write to Data Protection 
                  Officer, In Focus Operations Limited, 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.2 Who We Are</h3>
                <p className="mb-4">
                  In this Privacy Policy, references to 'we', 'us' or 'our' means In Focus Operations Limited, a company registered in England and 
                  Wales with company number 16707659 and whose registered address is 156 Russell Drive, Wollaton, Nottingham, England, NG8 2BE.
                </p>
                <p className="mb-4">
                  For the purposes of the UK GDPR, In Focus Operations Limited is the 'controller' of the personal data you provide to us.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.3 What Personal Data We Collect</h3>
                <p className="mb-4">We may collect and process the following personal data:</p>
                
                <h4 className="text-lg font-semibold mb-2 mt-4">Information You Provide to Us</h4>
                <p className="mb-4">When you:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Create an account and complete your church profile</li>
                  <li>Upload sermon transcripts or other content</li>
                  <li>Subscribe to our Service</li>
                  <li>Contact us by email or through the Service</li>
                  <li>Participate in surveys or provide feedback</li>
                </ul>
                <p className="mb-4">
                  The information you provide may include your name, email address, church name, church address, service times, social media handles, 
                  and any content you upload to the Service.
                </p>

                <h4 className="text-lg font-semibold mb-2 mt-4">Information We Collect Automatically</h4>
                <p className="mb-4">When you use the Service, we may automatically collect:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Technical information including IP address, browser type and version, time zone setting, operating system and platform</li>
                  <li>Information about your use of the Service including pages viewed, features used, content generated, and interaction patterns</li>
                  <li>Device information and identifiers</li>
                  <li>Cookies and similar tracking technologies (see Section 10.6 below)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.4 How We Use Your Personal Data</h3>
                <p className="mb-4">We use your personal data for the following purposes:</p>
                
                <h4 className="text-lg font-semibold mb-2 mt-4">Contract Performance</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>To provide the ivangel Service to you</li>
                  <li>To process your subscription and payments</li>
                  <li>To generate content based on your uploaded materials</li>
                  <li>To communicate with you regarding your account and the Service</li>
                  <li>To provide customer support and respond to enquiries</li>
                </ul>

                <h4 className="text-lg font-semibold mb-2 mt-4">Legitimate Interests</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Improving the quality and relevance of our Service</li>
                  <li>Analysing usage patterns to enhance features and functionality</li>
                  <li>Managing our business operations effectively</li>
                  <li>Detecting and preventing fraud or abuse</li>
                </ul>

                <h4 className="text-lg font-semibold mb-2 mt-4">Consent</h4>
                <p className="mb-4">
                  Where you have given express consent, we may send you newsletters, marketing communications, and updates about new features or services.
                </p>

                <h4 className="text-lg font-semibold mb-2 mt-4">Legal Obligations</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Complying with legal and regulatory requirements</li>
                  <li>Responding to lawful requests from authorities</li>
                  <li>Enforcing our Terms of Service</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.5 Who We Share Your Data With</h3>
                <p className="mb-4">We may share your personal data with:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>AI Service Providers:</strong> We use third-party AI services (including Anthropic Claude) to generate content. Your 
                  uploaded materials may be processed by these services to create Generated Content. These providers are bound by strict confidentiality 
                  and data processing agreements.</li>
                  <li><strong>Translation Services:</strong> We use Google Translate API for multi-language content generation. Your content may be 
                  sent to Google for translation purposes.</li>
                  <li><strong>IT Service Providers:</strong> Service providers who maintain our systems, hosting infrastructure, and technical support</li>
                  <li><strong>Payment Processors:</strong> Companies that process subscription payments on our behalf</li>
                  <li><strong>Analytics Providers:</strong> Services that help us understand how the Service is used (see Section 10.6 below)</li>
                  <li><strong>Professional Advisers:</strong> Including accountants, lawyers, and insurers</li>
                  <li><strong>Government Authorities:</strong> Where required by law or to respond to lawful requests</li>
                </ul>
                <p className="mb-4">
                  We do not sell your personal data to third parties. All third-party service providers are required to implement appropriate security 
                  measures and are bound by data processing agreements where required by law.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.6 Cookies and Tracking Technologies</h3>
                <p className="mb-4">
                  We use cookies and similar tracking technologies to collect information about how you use the Service. Cookies are small text files 
                  stored on your device that help us provide and improve the Service.
                </p>
                <p className="mb-4">We use cookies for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Essential Cookies:</strong> Required for the Service to function properly, such as authentication and session management</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the Service, which pages are visited, and how 
                  features are used</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings to enhance your experience</li>
                </ul>
                <p className="mb-4">
                  You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of the Service.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.7 Data Retention</h3>
                <p className="mb-4">We retain personal data for as long as necessary to fulfil the purposes we collected it for, including:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Account Information:</strong> While your account is active and for 6 years after account closure (for legal and tax purposes)</li>
                  <li><strong>Generated Content:</strong> Retained in your account for as long as your account is active. Content may be retained for 
                  30 days after account cancellation before deletion</li>
                  <li><strong>Payment Records:</strong> 6 years after the transaction (for legal and tax compliance)</li>
                  <li><strong>Marketing Contacts:</strong> Until you unsubscribe or request removal</li>
                  <li><strong>Usage Analytics:</strong> Aggregated and anonymised data may be retained for longer periods for service improvement</li>
                </ul>
                <p className="mb-4">
                  <strong>Important:</strong> We do not store your original sermon transcripts after they have been processed to generate content. Only 
                  the Generated Content and your church profile information are stored.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.8 Your Rights</h3>
                <p className="mb-4">Under the UK GDPR, you have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Right to Access:</strong> Request a copy of your personal data we hold</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data in certain circumstances (the "right to be forgotten")</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used, and machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to certain types of processing, including direct marketing</li>
                  <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw your consent at any time</li>
                </ul>
                <p className="mb-4">
                  To exercise any of these rights, please contact us using the details provided in Section 16 below. We will respond to your request 
                  within one month, though this period may be extended in complex cases.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.9 Data Security</h3>
                <p className="mb-4">
                  We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, 
                  disclosure, or destruction. This includes encryption, secure servers, regular security assessments, and staff training.
                </p>
                <p className="mb-4">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially 
                  acceptable means to protect your data, we cannot guarantee absolute security.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.10 International Data Transfers</h3>
                <p className="mb-4">
                  Your data may be transferred to and processed in countries outside the UK, including the United States (where our AI and translation 
                  service providers are located). Where such transfers occur, we ensure appropriate safeguards are in place, such as Standard Contractual 
                  Clauses approved by the UK Information Commissioner's Office.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.11 Complaints</h3>
                <p className="mb-4">
                  If you believe your data protection rights have been breached, you may lodge a complaint with the UK Information Commissioner's Office 
                  (ICO) at https://ico.org.uk/make-a-complaint/ or by calling 0303 123 1113.
                </p>
                <p className="mb-4">
                  We encourage you to contact us first to resolve any concerns, as we take data protection seriously and will work to address any issues.
                </p>
              </section>

              {/* Limitations and Disclaimers */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">11. Limitations and Disclaimers</h2>
                <h3 className="text-xl font-semibold mb-3">11.1 Service Availability</h3>
                <p className="mb-4">
                  While we strive to ensure the Service is available 24/7, we do not guarantee uninterrupted, timely, secure, or error-free operation. 
                  The Service may be unavailable due to maintenance, updates, technical issues, or circumstances beyond our control.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">11.2 AI-Generated Content Disclaimer</h3>
                <p className="mb-4">
                  The Service uses artificial intelligence to generate content. While we use advanced AI technology and implement quality controls, 
                  Generated Content may occasionally contain errors, inaccuracies, or may not always align perfectly with your expectations or 
                  theological perspectives.
                </p>
                <p className="mb-4">
                  You are solely responsible for reviewing, editing, and approving all Generated Content before publishing or using it in any way. We 
                  strongly recommend that you review all Generated Content for accuracy, theological appropriateness, and alignment with your church's 
                  values and beliefs.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">11.3 Limitation of Liability</h3>
                <p className="mb-4">
                  To the maximum extent permitted by UK law, In Focus Operations Limited shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of 
                  data, use, goodwill, or other intangible losses resulting from your use of the Service.
                </p>
                <p className="mb-4">
                  Our total liability to you for all claims arising out of or relating to the Service shall not exceed the amount you paid to us in 
                  the 12 months preceding the claim, or £50, whichever is greater.
                </p>
                <p className="mb-4">
                  Nothing in these Terms shall exclude or limit our liability for death or personal injury caused by our negligence, fraud, or any other 
                  liability that cannot be excluded or limited under UK law.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">11.4 No Warranty</h3>
                <p className="mb-4">
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not 
                  limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">12. Termination</h2>
                <h3 className="text-xl font-semibold mb-3">12.1 Termination by You</h3>
                <p className="mb-4">
                  You may terminate your account at any time by cancelling your subscription in accordance with Section 9 (Cancellation and Refunds) 
                  above.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">12.2 Termination by Us</h3>
                <p className="mb-4">
                  We may suspend or terminate your account immediately, without prior notice, if:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You breach any provision of these Terms</li>
                  <li>You engage in fraudulent, illegal, or harmful activity</li>
                  <li>You fail to pay subscription fees when due</li>
                  <li>We are required to do so by law or at the request of a government authority</li>
                  <li>We decide to discontinue the Service or any part thereof</li>
                </ul>
                <p className="mb-4">
                  Upon termination, your right to use the Service will immediately cease, and we may delete your account and content in accordance 
                  with our data retention policies. You will not be entitled to a refund for any unused portion of your subscription, except as set 
                  out in Section 9.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">13. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. Material changes will be communicated to you by email to the address 
                  associated with your account and/or through a notice on the Service at least 30 days before the changes take effect.
                </p>
                <p className="mb-4">
                  Your continued use of the Service after such changes constitutes acceptance of the modified Terms. If you do not agree to the 
                  changes, you must cancel your subscription and stop using the Service before the changes take effect.
                </p>
                <p className="mb-4">
                  The "Last updated" date at the top of these Terms indicates when they were last revised.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">14. Governing Law and Dispute Resolution</h2>
                <h3 className="text-xl font-semibold mb-3">14.1 Governing Law</h3>
                <p className="mb-4">
                  These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with 
                  the laws of England and Wales.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">14.2 Jurisdiction</h3>
                <p className="mb-4">
                  You and we both agree that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising 
                  out of or in connection with these Terms or the Service.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">14.3 Alternative Dispute Resolution</h3>
                <p className="mb-4">
                  Before initiating legal proceedings, we encourage you to contact us to resolve any disputes amicably. If you are a consumer, you may 
                  also use the European Commission's Online Dispute Resolution platform at https://ec.europa.eu/consumers/odr/ (or any successor 
                  platform) to seek resolution.
                </p>
              </section>

              {/* General Provisions */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">15. General Provisions</h2>
                <h3 className="text-xl font-semibold mb-3">15.1 Entire Agreement</h3>
                <p className="mb-4">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service and 
                  supersede all prior agreements and understandings.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.2 Severability</h3>
                <p className="mb-4">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the 
                  minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.3 Waiver</h3>
                <p className="mb-4">
                  Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.4 Assignment</h3>
                <p className="mb-4">
                  You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms or any rights 
                  hereunder without your consent.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.5 Force Majeure</h3>
                <p className="mb-4">
                  We shall not be liable for any failure or delay in performance under these Terms that is due to causes beyond our reasonable control, 
                  including but not limited to natural disasters, war, terrorism, labour disputes, internet failures, or acts of government.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-playfair font-bold mb-4">16. Contact Information</h2>
                <p className="mb-4">
                  If you have any questions, concerns, or requests regarding these Terms, the Service, or your account, please contact us:
                </p>
                <div className="bg-muted p-6 rounded-lg mb-4">
                  <p className="mb-2"><strong>In Focus Operations Limited</strong></p>
                  <p className="mb-2">156 Russell Drive</p>
                  <p className="mb-2">Wollaton</p>
                  <p className="mb-2">Nottingham</p>
                  <p className="mb-2">England, NG8 2BE</p>
                  <p className="mb-2">Company Number: 16707659</p>
                  <p className="mb-2">Email: <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a></p>
                  <p className="mb-2">Data Protection Officer: <a href="mailto:hello@infocusoperations.co.uk" className="text-primary hover:underline">hello@infocusoperations.co.uk</a></p>
                </div>
                <p className="mb-4">
                  For data protection queries, please mark your correspondence "FAO: Data Protection Officer" or email directly to 
                  hello@infocusoperations.co.uk with "Data Protection" in the subject line.
                </p>
              </section>

              {/* Closing */}
              <section className="pt-8 border-t border-border">
                <p className="text-muted-foreground italic mb-8">
                  By using ivangel, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not 
                  agree to these Terms, you must not use the Service.
                </p>
                <p className="text-sm text-muted-foreground">
                  In Focus Operations Limited Terms of Service Version 1.0<br />
                  Last updated: October 2025<br />
                  © 2025 In Focus Operations Limited. All rights reserved.
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

export default TermsOfService;


