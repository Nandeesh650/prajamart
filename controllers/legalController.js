const WEBSITE_NAME = "PrajaMart";
const COMPANY_NAME = "PrajaMart";
const EFFECTIVE_DATE = "May 1, 2026";

const CONTACT_PLACEHOLDERS = {
  supportEmail: "[Email Address]",
  supportPhone: "[Phone Number]",
  supportAddress: "[Business Address]",
  businessAddress: "[Address]",
  jurisdiction: "[City/State]"
};

const createSection = (title, options = {}) => ({
  title,
  paragraphs: options.paragraphs || [],
  bullets: options.bullets || []
});

const deliveryTerms = {
  slug: "delivery-partner",
  pageTitle: "Delivery Partner Terms",
  heroLabel: "Delivery Partner Terms & Conditions",
  intro: [
    `These Delivery Boy / Delivery Partner Terms and Conditions ("Terms") govern the relationship between ${WEBSITE_NAME}, operated by ${COMPANY_NAME}, and any individual engaged to deliver products or orders to customers through the platform ("Delivery Boy", "Delivery Partner", "Rider", "You", or "Your").`,
    `By registering or working as a Delivery Partner with ${WEBSITE_NAME}, you agree to be legally bound by these Terms and Conditions. If you do not agree with these Terms, you must not register or perform delivery services on the platform.`
  ],
  checkboxText: `I agree to the Delivery Partner Terms & Conditions, Payment Policy, COD Rules, Privacy Policy, and all delivery-related responsibilities of ${WEBSITE_NAME}.`,
  sections: [
    createSection("1. Definitions", {
      bullets: [
        `"Platform" refers to ${WEBSITE_NAME}, including the website, mobile application, and related services.`,
        `"Company", "We", "Us", or "Our" refers to ${COMPANY_NAME}.`,
        `"Delivery Partner", "Delivery Boy", "Rider", "You", or "Your" refers to the person assigned to collect and deliver orders to customers.`,
        `"Vendor" refers to the seller or merchant listed on the platform.`,
        `"Customer" refers to the person who places the order.`,
        `"Order" refers to the product or package assigned for delivery.`,
        `"Services" refers to all pickup, transportation, and delivery-related duties performed by the Delivery Partner.`
      ]
    }),
    createSection("2. Eligibility", {
      paragraphs: ["To work as a Delivery Partner on the platform, you must:"],
      bullets: [
        "Be at least 18 years of age.",
        "Possess a valid government-issued ID.",
        "Have a valid driving license if using a vehicle.",
        "Own or have authorized access to a vehicle if required.",
        "Be physically fit to perform delivery duties.",
        "Provide accurate personal, contact, and bank or payment details.",
        "Comply with all applicable traffic, transport, and local laws."
      ]
    }),
    createSection("3. Registration and Account", {
      paragraphs: [
        "To access delivery assignments, you may be required to create a Delivery Partner account.",
        "You agree that:"
      ],
      bullets: [
        "All registration details provided are true, accurate, and complete.",
        "You are responsible for maintaining the confidentiality of your login credentials.",
        "You are responsible for all activities conducted under your account.",
        "You will notify us immediately if your account is misused or accessed without authorization.",
        "The Company is not responsible for any loss caused by your failure to secure your account."
      ]
    }),
    createSection("4. Nature of Engagement", {
      paragraphs: [
        "The Delivery Partner is engaged for delivery-related services only.",
        "You acknowledge that:"
      ],
      bullets: [
        "Your role is limited to pickup and delivery of assigned orders.",
        "You are expected to perform your duties honestly, safely, and professionally.",
        "You are not authorized to make promises, warranties, or representations on behalf of the Company unless expressly approved.",
        "The Company may assign, monitor, or restrict delivery tasks based on operational needs and performance."
      ]
    }),
    createSection("5. Delivery Partner Responsibilities", {
      paragraphs: ["As a Delivery Partner, you agree to:"],
      bullets: [
        "Pick up orders from the assigned vendor, store, or warehouse on time.",
        "Deliver orders to customers at the correct location.",
        "Handle all packages carefully and safely.",
        "Follow delivery instructions provided by the platform or customer.",
        "Maintain proper communication with customer support, vendors, and customers when necessary.",
        "Ensure timely completion of assigned deliveries.",
        "Behave professionally at all times."
      ]
    }),
    createSection("6. Pickup and Delivery Rules", {
      paragraphs: ["The Delivery Partner must:"],
      bullets: [
        "Verify order details before pickup.",
        "Ensure the package is correct and properly sealed before leaving the pickup location.",
        "Deliver only to the intended customer or authorized recipient.",
        "Confirm delivery using the platform’s process such as OTP, signature, or status update.",
        "Follow the assigned route or delivery instructions where applicable."
      ]
    }),
    createSection("6A. Prohibited Conduct During Delivery", {
      paragraphs: ["The Delivery Partner must not:"],
      bullets: [
        "Tamper with, open, or misuse any package.",
        "Knowingly deliver orders to the wrong person.",
        "Delay deliveries intentionally.",
        "Keep customer products for personal use.",
        "Cancel or reject deliveries repeatedly without valid reason.",
        "Any such misconduct may lead to penalties, suspension, termination, or legal action."
      ]
    }),
    createSection("7. Code of Conduct", {
      paragraphs: [
        "The Delivery Partner must maintain respectful and professional conduct at all times.",
        "You agree that you will not:"
      ],
      bullets: [
        "Use abusive, threatening, or inappropriate language.",
        "Misbehave with customers, vendors, or support staff.",
        "Engage in harassment, discrimination, or violence.",
        "Consume alcohol or intoxicating substances while on duty.",
        "Perform delivery duties in an unsafe or reckless condition.",
        "Damage the reputation of the platform."
      ]
    }),
    createSection("8. Safety and Legal Compliance", {
      paragraphs: [
        "The Delivery Partner is responsible for following all applicable safety and traffic rules.",
        "You agree to:"
      ],
      bullets: [
        "Obey all traffic laws and road safety regulations.",
        "Wear a helmet and safety gear where applicable.",
        "Use your vehicle responsibly and legally.",
        "Keep your vehicle in roadworthy condition.",
        "Avoid dangerous or unlawful conduct during deliveries.",
        "The Company is not responsible for accidents, injuries, penalties, or losses caused by your negligence, unsafe driving, or legal violations."
      ]
    }),
    createSection("9. Payment and Earnings", {
      paragraphs: [
        "The Delivery Partner may receive compensation based on the platform’s payout structure.",
        "Payments may be based on:"
      ],
      bullets: [
        "Number of deliveries completed.",
        "Distance traveled.",
        "Time slots or shifts.",
        "Incentives or bonuses.",
        "Special delivery zones or peak-hour rates.",
        "Payments will be made as per the platform’s payout cycle.",
        "Incentives or bonuses are subject to eligibility and performance criteria.",
        "The Company may deduct penalties, adjustments, or recoveries where applicable.",
        "Payments may be withheld in case of fraud, disputes, policy violations, or delivery issues.",
        "All payouts will be made to the registered bank account or approved payment method."
      ]
    }),
    createSection("10. Cash on Delivery Responsibilities", {
      paragraphs: ["If assigned a Cash on Delivery order, the Delivery Partner agrees to:"],
      bullets: [
        "Collect the exact payable amount from the customer.",
        "Handle cash responsibly and honestly.",
        "Submit collected cash to the Company or vendor as instructed.",
        "Not misuse, delay, or conceal COD collections.",
        "Any shortage, misuse, or misappropriation of COD amounts may result in immediate suspension, recovery action, legal proceedings, and termination."
      ]
    }),
    createSection("11. Uniform, Identity, and Equipment", {
      paragraphs: ["If the Company provides any uniform, delivery bag, ID card, or equipment, the Delivery Partner agrees to:"],
      bullets: [
        "Use such items only for official delivery work.",
        "Maintain them in good condition.",
        "Return them upon request, suspension, or termination.",
        "Not misuse the Company’s branding or identity.",
        "Loss or damage to Company property may result in recovery charges where applicable."
      ]
    }),
    createSection("12. Customer Privacy and Confidentiality", {
      paragraphs: [
        "The Delivery Partner may have access to limited customer information such as name, address, phone number, and delivery instructions.",
        "You agree that:"
      ],
      bullets: [
        "Customer information must be used only for completing the delivery.",
        "You will not misuse, store, share, sell, or disclose customer information.",
        "You will not contact customers for personal, promotional, or unauthorized reasons.",
        "Any misuse of customer data may result in immediate termination and legal action."
      ]
    }),
    createSection("13. Order Issues and Disputes", {
      paragraphs: [
        "If any issue occurs during pickup or delivery, the Delivery Partner must report it immediately through the appropriate platform or support channel.",
        "Examples include:"
      ],
      bullets: [
        "Wrong address.",
        "Customer unavailable.",
        "Package damaged.",
        "COD issue.",
        "Vendor delay.",
        "Safety issue.",
        "Order mismatch.",
        "The Delivery Partner must not independently resolve disputes in an aggressive, unauthorized, or unlawful manner.",
        "The Company reserves the right to investigate complaints and make final decisions regarding disputes."
      ]
    }),
    createSection("14. Damaged, Lost, or Mishandled Orders", {
      paragraphs: ["The Delivery Partner may be held responsible if an order is:"],
      bullets: [
        "Lost due to negligence.",
        "Damaged due to careless handling.",
        "Delivered incorrectly due to negligence.",
        "Misused, stolen, or tampered with.",
        "The Company may investigate such incidents and may recover the cost of loss or damage where justified."
      ]
    }),
    createSection("15. Attendance, Availability, and Performance", {
      paragraphs: [
        "The Delivery Partner agrees to maintain reasonable reliability and performance standards.",
        "The Company may evaluate performance based on:"
      ],
      bullets: [
        "On-time delivery rate.",
        "Order acceptance rate.",
        "Delivery completion rate.",
        "Customer feedback.",
        "Professional behavior.",
        "Policy compliance.",
        "Repeated poor performance, excessive cancellations, delays, misconduct, or complaints may lead to account restrictions or termination."
      ]
    }),
    createSection("16. Suspension or Termination", {
      paragraphs: ["The Company reserves the right to suspend, deactivate, or permanently terminate a Delivery Partner account at any time if the Delivery Partner:"],
      bullets: [
        "Violates these Terms and Conditions.",
        "Engages in fraud or misconduct.",
        "Misuses customer or company property or data.",
        "Repeatedly fails to complete deliveries.",
        "Receives serious complaints.",
        "Violates legal or safety requirements.",
        "Misuses COD collections.",
        "Upon suspension or termination, access to the platform may be blocked immediately, pending payments may be reviewed before release, company property may need to be returned, and further assignments may be cancelled."
      ]
    }),
    createSection("17. Independent Responsibility", {
      paragraphs: ["The Delivery Partner is personally responsible for:"],
      bullets: [
        "Fuel expenses.",
        "Mobile or internet usage.",
        "Vehicle maintenance.",
        "Insurance if applicable.",
        "Traffic fines or legal penalties.",
        "Personal safety and health during service.",
        "Unless specifically stated in writing, the Company is not responsible for these personal operational costs."
      ]
    }),
    createSection("18. Limitation of Liability", {
      paragraphs: [`To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for:`],
      bullets: [
        "Personal injury or accident caused by the Delivery Partner’s negligence.",
        "Vehicle damage or maintenance costs.",
        "Traffic fines or legal violations.",
        "Losses arising from third-party misconduct.",
        "Temporary service interruptions or app issues.",
        "Indirect or consequential damages.",
        "The Delivery Partner agrees that the Company’s liability, if any, shall be limited to the extent permitted under applicable law."
      ]
    }),
    createSection("19. Indemnification", {
      paragraphs: [`The Delivery Partner agrees to indemnify and hold harmless ${COMPANY_NAME}, its employees, directors, vendors, and affiliates against any claims, damages, losses, costs, or liabilities arising out of:`],
      bullets: [
        "Breach of these Terms.",
        "Unsafe or illegal conduct.",
        "Misdelivery or mishandling of orders.",
        "Customer complaints caused by Delivery Partner misconduct.",
        "Violation of traffic or transport laws.",
        "Misuse of COD or customer information."
      ]
    }),
    createSection("20. Changes to Terms", {
      paragraphs: [
        "The Company may modify or update these Terms and Conditions at any time.",
        "Any changes will become effective upon publication on the website, app, dashboard, or official communication channel. Continued use of the platform after such updates will be treated as acceptance of the revised Terms."
      ]
    }),
    createSection("21. Governing Law and Jurisdiction", {
      paragraphs: [
        "These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India.",
        `Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in ${CONTACT_PLACEHOLDERS.jurisdiction}.`
      ]
    }),
    createSection("22. Contact Information", {
      bullets: [
        COMPANY_NAME,
        `Delivery Support Email: ${CONTACT_PLACEHOLDERS.supportEmail}`,
        `Phone: ${CONTACT_PLACEHOLDERS.supportPhone}`,
        `Address: ${CONTACT_PLACEHOLDERS.supportAddress}`
      ]
    }),
    createSection("23. Acceptance of Terms", {
      paragraphs: [
        `By registering as a Delivery Partner, accepting delivery tasks, or using the delivery platform of ${WEBSITE_NAME}, you confirm that you have read, understood, and agreed to these Terms and Conditions.`
      ]
    })
  ]
};

const vendorTerms = {
  slug: "vendor",
  pageTitle: "Vendor Terms",
  heroLabel: "Vendor Terms & Conditions",
  intro: [
    `These Vendor Terms and Conditions ("Terms") govern the relationship between ${WEBSITE_NAME}, operated by ${COMPANY_NAME}, and any individual, business, seller, merchant, or supplier ("Vendor", "Seller", "You", or "Your") who registers, lists, markets, or sells products through the platform.`,
    `By registering as a Vendor on ${WEBSITE_NAME}, you agree to be legally bound by these Terms and Conditions. If you do not agree to these Terms, you must not use the Vendor services of the platform.`
  ],
  checkboxText: `I agree to the Vendor Terms & Conditions, Commission Policy, Return Policy, Privacy Policy, and all seller obligations of ${WEBSITE_NAME}.`,
  sections: [
    createSection("1. Definitions", {
      bullets: [
        `"Platform" refers to ${WEBSITE_NAME}, including website, mobile application, and all associated services.`,
        `"Company", "We", "Us", or "Our" refers to ${COMPANY_NAME}.`,
        `"Vendor", "Seller", "Merchant", "You", or "Your" refers to any registered seller using the platform to offer products for sale.`,
        `"Customer" refers to any person who purchases products through the platform.`,
        `"Products" refers to all goods listed by Vendors for sale.`,
        `"Order" refers to a customer purchase request confirmed on the platform.`,
        `"Commission" refers to the fee charged by the platform for facilitating sales.`
      ]
    }),
    createSection("2. Vendor Eligibility", {
      paragraphs: ["To register and sell on the platform, the Vendor must:"],
      bullets: [
        "Be at least 18 years of age.",
        "Be legally capable of entering into a binding agreement.",
        "Provide valid business, identity, tax, and bank details.",
        "Have the legal right to sell the products listed.",
        "Comply with all applicable laws, regulations, and licensing requirements.",
        "The platform reserves the right to approve, reject, or suspend any Vendor registration at its sole discretion."
      ]
    }),
    createSection("3. Vendor Registration and Account", {
      paragraphs: [
        "To access Vendor services, you must create a Vendor account and provide accurate, complete, and current information.",
        "You agree that:"
      ],
      bullets: [
        "All information submitted during registration is true and correct.",
        "You are responsible for maintaining the confidentiality of your login credentials.",
        "You are responsible for all activities conducted through your account.",
        "You will immediately notify us of any unauthorized use or suspicious activity.",
        "The Company shall not be liable for any loss resulting from unauthorized access due to Vendor negligence."
      ]
    }),
    createSection("4. Vendor Obligations", {
      paragraphs: ["As a Vendor, you agree to:"],
      bullets: [
        "List only genuine, legal, and approved products.",
        "Ensure all product information is accurate and not misleading.",
        "Maintain sufficient inventory for listed products.",
        "Process orders promptly and professionally.",
        "Package products securely and appropriately.",
        "Deliver products within the agreed timeline.",
        "Respond to customer issues, complaints, and returns in a timely manner.",
        "Maintain professional conduct while using the platform."
      ]
    }),
    createSection("5. Product Listings", {
      paragraphs: [
        "The Vendor is responsible for creating and maintaining product listings, including product title, description, specifications, images, price, quantity or stock, variation details, and warranty or usage instructions where applicable.",
        "The Vendor agrees that:"
      ],
      bullets: [
        "Product information must be accurate, lawful, and not misleading.",
        "Images used must be original or legally authorized.",
        "Listed products must match the delivered products.",
        "Products must comply with quality and safety standards.",
        "The Company reserves the right to edit, suspend, or remove any product listing that violates platform policies or applicable laws."
      ]
    }),
    createSection("6. Prohibited Products", {
      paragraphs: ["Vendors are strictly prohibited from listing or selling any products that are:"],
      bullets: [
        "Illegal or unauthorized.",
        "Counterfeit, fake, or pirated.",
        "Expired, unsafe, or defective.",
        "Stolen goods.",
        "Offensive, obscene, or prohibited by law.",
        "Restricted or regulated without proper license or approval.",
        "In violation of intellectual property rights.",
        "If any prohibited product is found, the platform may immediately remove the listing, suspend the Vendor account, withhold payments, and take legal action if necessary."
      ]
    }),
    createSection("7. Pricing of Products", {
      paragraphs: ["The Vendor is responsible for setting the price of their products. You agree that:"],
      bullets: [
        "All prices must be fair, transparent, and accurate.",
        "Pricing should not include hidden charges.",
        "Prices must comply with applicable tax and consumer laws.",
        "Any discounts, promotional pricing, or offers must be clearly stated.",
        "The platform reserves the right to intervene in case of obvious pricing errors, suspicious pricing behavior, or unfair trade practices."
      ]
    }),
    createSection("8. Orders and Fulfillment", {
      paragraphs: ["When a customer places an order for a Vendor’s product:"],
      bullets: [
        "The Vendor must confirm and process the order within the required time.",
        "The Vendor must dispatch the order promptly.",
        "The Vendor must ensure the product matches the listing.",
        "The Vendor must avoid unnecessary delays or cancellations.",
        "The Vendor must not accept orders without stock availability, ship incorrect or damaged products, delay dispatch without valid reason, or cancel confirmed orders excessively.",
        "Repeated fulfillment failures may result in penalties, suspension, or termination of Vendor access."
      ]
    }),
    createSection("9. Shipping and Delivery Responsibilities", {
      paragraphs: ["The Vendor shall be responsible for:"],
      bullets: [
        "Proper packaging of products.",
        "Dispatching products within the committed timeline.",
        "Providing accurate shipping details where applicable.",
        "Coordinating with delivery or logistics partners if required.",
        "The Vendor must ensure that products are delivered in good condition and within a reasonable timeframe.",
        "The Company shall not be liable for losses caused by Vendor packaging errors, delayed dispatch, or incorrect shipping information provided by the Vendor."
      ]
    }),
    createSection("10. Returns, Refunds, and Replacements", {
      paragraphs: [
        "The Vendor agrees to comply with the platform’s Return, Refund, and Replacement Policy.",
        "The Vendor may be required to accept returns or replacements in cases such as wrong item delivered, damaged product, defective product, product not matching description, or missing items.",
        "Refunds may be processed to customers in accordance with the platform policy, and the corresponding amount may be adjusted against the Vendor’s payable balance where applicable.",
        "The Company reserves the right to resolve customer disputes fairly and may take action based on available evidence."
      ]
    }),
    createSection("11. Commission, Fees, and Payments", {
      paragraphs: ["The Vendor agrees that the platform may charge:"],
      bullets: [
        "Sales commission.",
        "Listing fees if applicable.",
        "Advertising or promotional charges if applicable.",
        "Payment gateway charges.",
        "Shipping or service-related deductions if applicable.",
        "Vendor earnings will be calculated after deducting applicable fees, taxes, refunds, penalties, and commissions.",
        "Payments will be settled to the Vendor’s registered bank account as per the platform payout schedule.",
        "The Company reserves the right to hold or delay payments in case of disputes, fraud review, returns, policy violations, or legal issues.",
        "A detailed payment summary may be made available in the Vendor dashboard or statement."
      ]
    }),
    createSection("12. Taxes and Legal Compliance", {
      paragraphs: ["The Vendor is solely responsible for:"],
      bullets: [
        "Payment of applicable taxes.",
        "Maintaining GST, VAT, or other tax registration where required.",
        "Issuing invoices where applicable.",
        "Compliance with local, state, national, and international trade laws.",
        "Maintaining required licenses and approvals.",
        "The platform shall not be responsible for any tax liability, legal non-compliance, or penalties arising from the Vendor’s business operations."
      ]
    }),
    createSection("13. Intellectual Property Rights", {
      paragraphs: [
        "The Vendor confirms that they own or have legal rights to use all product names, descriptions, logos, images, trademarks, and content uploaded to the platform and that their listings do not infringe the rights of any third party.",
        `By listing products on the platform, the Vendor grants ${COMPANY_NAME} a non-exclusive, royalty-free, worldwide right to use, display, reproduce, publish, and promote the Vendor’s product content for the purpose of operating and marketing the platform.`,
        "The Vendor remains responsible for any intellectual property disputes arising from their listings."
      ]
    }),
    createSection("14. Customer Service and Vendor Conduct", {
      paragraphs: ["The Vendor agrees to maintain professional behavior and provide reasonable customer support. The Vendor must not:"],
      bullets: [
        "Mislead customers.",
        "Use abusive, threatening, or inappropriate language.",
        "Manipulate reviews or ratings.",
        "Encourage off-platform transactions.",
        "Contact customers for unauthorized purposes.",
        "Engage in fraudulent or deceptive conduct.",
        "The platform reserves the right to monitor Vendor performance and customer complaints."
      ]
    }),
    createSection("15. Reviews and Ratings", {
      paragraphs: ["Customers may leave ratings and reviews for products and services. The Vendor agrees that:"],
      bullets: [
        "Reviews are part of the customer experience.",
        "The platform may display ratings and feedback publicly.",
        "Vendors must not post fake reviews or influence customers unfairly.",
        "The Company may remove reviews that violate content or legal standards.",
        "Poor Vendor performance reflected through repeated complaints or low ratings may lead to account review or suspension."
      ]
    }),
    createSection("16. Suspension, Restriction, or Termination", {
      paragraphs: ["The Company reserves the right to suspend, restrict, or permanently terminate a Vendor account at any time if the Vendor:"],
      bullets: [
        "Violates these Terms and Conditions.",
        "Sells prohibited or illegal products.",
        "Engages in fraud or suspicious activity.",
        "Receives repeated customer complaints.",
        "Fails to fulfill orders properly.",
        "Violates intellectual property rights.",
        "Fails to comply with applicable laws or platform policies.",
        "Upon suspension or termination, product listings may be removed, pending orders may be cancelled or reassigned, payments may be withheld pending review, and access to Vendor services may be restricted immediately."
      ]
    }),
    createSection("17. Limitation of Liability", {
      paragraphs: [`To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for:`],
      bullets: [
        "Loss of profits or business opportunities.",
        "Indirect or consequential damages.",
        "Customer disputes arising from Vendor products.",
        "Product defects, safety issues, or quality problems.",
        "Shipping losses caused by Vendor error.",
        "Legal claims arising from Vendor misconduct.",
        "Platform interruptions, technical failures, or service outages.",
        "The Vendor agrees that the Company’s total liability, if any, shall be limited to the amount actually payable to the Vendor for the specific disputed transaction."
      ]
    }),
    createSection("18. Indemnification", {
      paragraphs: [`The Vendor agrees to indemnify, defend, and hold harmless ${COMPANY_NAME}, its directors, employees, agents, and affiliates from and against any claims, losses, liabilities, damages, costs, or legal expenses arising out of:`],
      bullets: [
        "Vendor’s breach of these Terms.",
        "Product defects or safety issues.",
        "Intellectual property infringement.",
        "Violation of law or regulation.",
        "Misrepresentation of products.",
        "Customer complaints or disputes caused by Vendor conduct."
      ]
    }),
    createSection("19. Confidentiality", {
      paragraphs: [
        "The Vendor agrees to keep confidential any non-public information received through the platform, including customer information, sales reports, payment details, internal policies, and business or operational information.",
        "The Vendor must not misuse, share, or disclose such information except as required by law or authorized by the Company."
      ]
    }),
    createSection("20. Data Protection and Privacy", {
      paragraphs: ["The Vendor agrees to handle customer data responsibly and in accordance with applicable privacy laws. The Vendor must not:"],
      bullets: [
        "Collect customer information outside permitted platform processes.",
        "Use customer data for spam or unauthorized marketing.",
        "Share or sell customer data to third parties.",
        "Misuse any personal information obtained through the platform.",
        "Violation of privacy obligations may result in immediate suspension and legal action."
      ]
    }),
    createSection("21. Platform Rights", {
      paragraphs: [`The Company reserves the right to:`],
      bullets: [
        "Modify platform features and policies.",
        "Change commission rates, service fees, or operational procedures.",
        "Review, remove, or restrict listings.",
        "Audit Vendor activity and compliance.",
        "Investigate complaints, fraud, or legal issues.",
        "Introduce new tools, programs, or seller requirements.",
        "Such changes may be communicated through the website, dashboard, or email and will become effective as stated."
      ]
    }),
    createSection("22. Governing Law and Jurisdiction", {
      paragraphs: [
        "These Terms shall be governed by and interpreted in accordance with the laws of India.",
        `Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in ${CONTACT_PLACEHOLDERS.jurisdiction}.`
      ]
    }),
    createSection("23. Amendments to Terms", {
      paragraphs: [
        "The Company may update or revise these Vendor Terms and Conditions at any time.",
        "The updated version will be published on the platform and shall become effective immediately or on the specified date. Continued use of the Vendor account after such changes constitutes acceptance of the revised Terms.",
        "Vendors are advised to review these Terms regularly."
      ]
    }),
    createSection("24. Contact Information", {
      bullets: [
        COMPANY_NAME,
        `Vendor Support Email: ${CONTACT_PLACEHOLDERS.supportEmail}`,
        `Phone: ${CONTACT_PLACEHOLDERS.supportPhone}`,
        `Business Address: ${CONTACT_PLACEHOLDERS.businessAddress}`
      ]
    }),
    createSection("25. Acceptance of Terms", {
      paragraphs: [
        `By registering, listing products, or using Vendor services on ${WEBSITE_NAME}, you acknowledge that you have read, understood, and agreed to these Vendor Terms and Conditions.`
      ]
    })
  ]
};

const customerTerms = {
  slug: "customer",
  pageTitle: "Customer Terms",
  heroLabel: "Customer Terms & Conditions",
  intro: [
    `Welcome to ${WEBSITE_NAME}, operated by ${COMPANY_NAME}. By accessing or using our website, mobile application, or services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.`,
    "If you do not agree with any part of these Terms, you should not use our website or services."
  ],
  checkboxText: `I agree to the Customer Terms & Conditions, Privacy Policy, Return Policy, and platform rules of ${WEBSITE_NAME}.`,
  sections: [
    createSection("1. Definitions", {
      bullets: [
        `"Website" refers to ${WEBSITE_NAME}.`,
        `"Company", "We", "Us", or "Our" refers to ${COMPANY_NAME}.`,
        `"Customer", "User", "You", or "Your" refers to any person who accesses or uses the website to browse, purchase, or interact with products and services.`,
        `"Products" refers to all goods listed and sold on the website.`,
        `"Services" refers to all website-related services including browsing, ordering, payment, delivery, support, and communication.`
      ]
    }),
    createSection("2. Eligibility", {
      paragraphs: ["By using this website, you confirm that:"],
      bullets: [
        "You are at least 18 years old, or you are using the website under the supervision of a parent or legal guardian.",
        "You are legally capable of entering into a binding agreement.",
        "All information provided by you is true, accurate, and complete.",
        "We reserve the right to refuse service, suspend accounts, or cancel orders if false or misleading information is provided."
      ]
    }),
    createSection("3. Account Registration", {
      paragraphs: ["To access certain features of the website, you may be required to create an account. You agree that:"],
      bullets: [
        "You will provide accurate, current, and complete information.",
        "You are responsible for maintaining the confidentiality of your login credentials.",
        "You are responsible for all activities carried out under your account.",
        "You will immediately notify us if you suspect unauthorized access or misuse of your account.",
        "We are not liable for any loss or damage resulting from your failure to protect your account credentials."
      ]
    }),
    createSection("4. Use of the Website", {
      paragraphs: ["You agree to use the website only for lawful purposes. You must not:"],
      bullets: [
        "Use the website for any fraudulent or illegal activity.",
        "Attempt to gain unauthorized access to our systems or other users’ accounts.",
        "Upload or transmit viruses, malware, or harmful code.",
        "Copy, reproduce, distribute, or exploit website content without permission.",
        "Use automated tools, bots, or scraping software without authorization.",
        "Interfere with the proper functioning of the website.",
        "Any misuse of the website may result in account suspension, legal action, or permanent restriction of access."
      ]
    }),
    createSection("5. Product Information", {
      paragraphs: [
        "We make every effort to display product descriptions, pricing, specifications, availability, and images as accurately as possible. However:",
      ],
      bullets: [
        "Product images are for illustrative purposes only.",
        "Actual product color, size, packaging, or appearance may vary slightly.",
        "Product descriptions may contain typographical or technical errors.",
        "Availability of products is subject to change without notice.",
        "We do not guarantee that all product information is always complete, accurate, or current."
      ]
    }),
    createSection("6. Pricing and Payment", {
      paragraphs: ["All prices listed on the website are in INR and are subject to change without prior notice. You agree that:"],
      bullets: [
        "You will pay the full price of the products ordered.",
        "Additional charges such as shipping fees, taxes, and service charges may apply.",
        "Payments must be made using approved payment methods available on the website.",
        "We reserve the right to correct pricing errors at any time.",
        "We may cancel or refuse orders placed with incorrect pricing.",
        "We may refuse or restrict suspicious transactions.",
        "If a payment is unsuccessful, your order may not be processed."
      ]
    }),
    createSection("7. Order Acceptance and Cancellation", {
      paragraphs: [
        "Placing an order on the website does not guarantee acceptance of the order. Your order is considered accepted only when it is confirmed by us.",
        "We reserve the right to:"
      ],
      bullets: [
        "Accept or reject any order at our sole discretion.",
        "Cancel orders due to product unavailability.",
        "Cancel orders if payment is not received.",
        "Cancel orders suspected of fraud or misuse.",
        "Limit the quantity of products purchased per customer.",
        "If your order is cancelled after payment, the refund will be processed according to our refund policy."
      ]
    }),
    createSection("8. Shipping and Delivery", {
      paragraphs: [
        "We aim to deliver products within the estimated delivery time shown on the website. However, delivery timelines are approximate and may vary due to courier delays, weather conditions, public holidays, stock availability, or incorrect shipping information provided by the customer.",
        "Customer responsibilities include:"
      ],
      bullets: [
        "Providing accurate delivery address and contact details.",
        "Ensuring availability to receive the order.",
        "We are not responsible for delays or failed deliveries caused by incorrect information or circumstances beyond our control."
      ]
    }),
    createSection("9. Return, Refund, and Replacement Policy", {
      paragraphs: [
        "Customers may request returns, refunds, or replacements subject to our policy.",
        "Products may be eligible for return or replacement if the item is damaged upon delivery, the wrong product was delivered, the product is defective, or the return request is made within the allowed return period.",
        "Products may not be eligible if they have been used, damaged, or altered by the customer, are non-returnable items such as personal care, food items, or customized products, or the return request is made after the return window expires.",
        "Refunds, if approved, will be processed to the original payment method or as store credit within a reasonable time."
      ]
    }),
    createSection("10. Customer Responsibilities", {
      paragraphs: ["As a customer, you agree to:"],
      bullets: [
        "Provide accurate billing and shipping details.",
        "Review product details carefully before purchase.",
        "Use purchased products in accordance with their intended purpose and safety instructions.",
        "Not misuse promotional offers, discount codes, or return policies.",
        "Cooperate with customer support for dispute resolution.",
        "Any abuse of customer rights may lead to account restriction or order cancellation."
      ]
    }),
    createSection("11. Offers, Discounts, and Promotions", {
      paragraphs: [
        "From time to time, we may provide discount coupons, cashback offers, promotional codes, or limited-time sales.",
        "These offers are subject to specific terms and may include validity periods, minimum order value, product category restrictions, or one-time use limitations.",
        "We reserve the right to modify, suspend, or withdraw promotions at any time without prior notice."
      ]
    }),
    createSection("12. Intellectual Property", {
      paragraphs: [
        `All content on the website, including logos, text, images, product descriptions, graphics, videos, website design, and software, is the property of ${COMPANY_NAME} or its licensors and is protected by intellectual property laws.`,
        "You may not copy, modify, reproduce, republish, or distribute any website content without our prior written permission."
      ]
    }),
    createSection("13. Privacy Policy", {
      paragraphs: [
        "Your use of the website is also governed by our Privacy Policy.",
        "By using our website, you consent to the collection, use, and storage of your information in accordance with our Privacy Policy, including name, contact details, payment information, order history, and browsing behavior.",
        "We take reasonable steps to protect your personal information, but we cannot guarantee absolute security."
      ]
    }),
    createSection("14. Limitation of Liability", {
      paragraphs: [`To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for:`],
      bullets: [
        "Indirect, incidental, or consequential damages.",
        "Loss of profits, data, or business opportunities.",
        "Delays in delivery.",
        "Product misuse by customers.",
        "Temporary website downtime or technical issues.",
        "Unauthorized access to user accounts due to customer negligence.",
        "Our total liability for any claim arising out of your use of the website or purchase of products shall not exceed the amount paid by you for the specific order giving rise to the claim."
      ]
    }),
    createSection("15. Disclaimer of Warranties", {
      paragraphs: [
        "The website and all products or services are provided on an \"as is\" and \"as available\" basis.",
        "We do not guarantee that the website will always be uninterrupted or error-free, that all product descriptions will be fully accurate, or that the website will always be secure or free from harmful components.",
        "Except where required by law, we disclaim all warranties, whether express or implied."
      ]
    }),
    createSection("16. Suspension or Termination", {
      paragraphs: ["We reserve the right to suspend or terminate your access to the website, with or without notice, if:"],
      bullets: [
        "You violate these Terms and Conditions.",
        "You engage in fraudulent or abusive behavior.",
        "You misuse promotions or return policies.",
        "We are required to do so by law.",
        "Termination does not affect any rights or obligations that arose before termination."
      ]
    }),
    createSection("17. Third-Party Links and Services", {
      paragraphs: [
        "Our website may contain links to third-party websites, payment gateways, delivery partners, or external services.",
        "We are not responsible for the content of third-party websites, their privacy practices, their terms of service, or any loss or damage caused by third-party services.",
        "You use third-party services at your own risk."
      ]
    }),
    createSection("18. Governing Law and Jurisdiction", {
      paragraphs: [
        "These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India.",
        `Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in ${CONTACT_PLACEHOLDERS.jurisdiction}.`
      ]
    }),
    createSection("19. Changes to Terms and Conditions", {
      paragraphs: [
        "We reserve the right to modify or update these Terms and Conditions at any time without prior notice.",
        "Any changes will be effective immediately upon posting on the website. Your continued use of the website after such changes constitutes your acceptance of the revised Terms.",
        "We recommend reviewing these Terms periodically."
      ]
    }),
    createSection("20. Contact Information", {
      bullets: [
        COMPANY_NAME,
        `Email: ${CONTACT_PLACEHOLDERS.supportEmail}`,
        `Phone: ${CONTACT_PLACEHOLDERS.supportPhone}`,
        `Address: ${CONTACT_PLACEHOLDERS.supportAddress}`
      ]
    }),
    createSection("21. Acceptance of Terms", {
      paragraphs: [
        `By using ${WEBSITE_NAME}, creating an account, or placing an order, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.`
      ]
    })
  ]
};

const termsBySlug = {
  customer: customerTerms,
  vendor: vendorTerms,
  "delivery-partner": deliveryTerms
};

const renderTermsPage = (req, res, terms) => {
  res.render("legal/terms", {
    pageTitle: terms.pageTitle,
    currentPage: `terms-${terms.slug}`,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    effectiveDate: EFFECTIVE_DATE,
    terms
  });
};

exports.getCustomerTerms = (req, res) => {
  renderTermsPage(req, res, customerTerms);
};

exports.getVendorTerms = (req, res) => {
  renderTermsPage(req, res, vendorTerms);
};

exports.getDeliveryPartnerTerms = (req, res) => {
  renderTermsPage(req, res, deliveryTerms);
};
