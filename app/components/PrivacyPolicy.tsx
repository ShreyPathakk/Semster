import React from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


// Main Privacy Policy Component
const PrivacyPolicy = () => {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.content}>
        {/* Main Title and Date */}
        <Text style={styles.mainTitle}>PRIVACY POLICY</Text>
        <Text style={styles.date}>Last updated January 18, 2025</Text>

        {/* Introductory Text */}
        <Text style={styles.paragraph}>
          This Privacy Notice for __________ ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
        </Text>
        <Text style={styles.bulletPoints}>• Download and use our mobile application (Semster), or any other application of ours that links to this Privacy Notice</Text>
        <Text style={styles.bulletPoints}>• Engage with us in other related ways, including any sales, marketing, or events</Text>

        <Text style={styles.paragraph}>
          Questions or concerns? Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services.
        </Text>

        {/* Summary of Key Points */}
        <Text style={styles.sectionTitle}>SUMMARY OF KEY POINTS</Text>
        <Text style={styles.summary}>
          This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
        </Text>
        <Text style={styles.bulletPoints}>
          • What personal information do we process? When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.
        </Text>
        <Text style={styles.bulletPoints}>
          • Do we process any sensitive personal information? Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law. Learn more about sensitive information we process.
        </Text>
        <Text style={styles.bulletPoints}>
          • Do we collect any information from third parties? We do not collect any information from third parties.
        </Text>
        <Text style={styles.bulletPoints}>
          • How do we process your information? We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.
        </Text>
        <Text style={styles.bulletPoints}>
          • In what situations and with which parties do we share personal information? We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.
        </Text>
        <Text style={styles.bulletPoints}>
          • How do we keep your information safe? We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about how we keep your information safe.
        </Text>
        <Text style={styles.bulletPoints}>
          • What are your rights? Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about your privacy rights.
        </Text>
        <Text style={styles.bulletPoints}>
          • How do you exercise your rights? The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
        </Text>

        <Text style={styles.paragraph}>
          Want to learn more about what we do with any information we collect? Review the Privacy Notice in full.
        </Text>

        {/* Table of Contents */}
        <Text style={styles.sectionTitle}>TABLE OF CONTENTS</Text>
        <Text style={styles.bulletPoints}>1. WHAT INFORMATION DO WE COLLECT?</Text>
        <Text style={styles.bulletPoints}>2. HOW DO WE PROCESS YOUR INFORMATION?</Text>
        <Text style={styles.bulletPoints}>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</Text>
        <Text style={styles.bulletPoints}>4. HOW LONG DO WE KEEP YOUR INFORMATION?</Text>
        <Text style={styles.bulletPoints}>5. HOW DO WE KEEP YOUR INFORMATION SAFE?</Text>
        <Text style={styles.bulletPoints}>6. DO WE COLLECT INFORMATION FROM MINORS?</Text>
        <Text style={styles.bulletPoints}>7. WHAT ARE YOUR PRIVACY RIGHTS?</Text>
        <Text style={styles.bulletPoints}>8. CONTROLS FOR DO-NOT-TRACK FEATURES</Text>
        <Text style={styles.bulletPoints}>9. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</Text>
        <Text style={styles.bulletPoints}>10. DATA HOSTING AND MANAGEMENT</Text>
        <Text style={styles.bulletPoints}>11. DO WE MAKE UPDATES TO THIS NOTICE?</Text>
        <Text style={styles.bulletPoints}>12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</Text>
        <Text style={styles.bulletPoints}>13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</Text>

        {/* Additional sections and full text implementation */}
        {/* BELOW IS THE FULL POLICY TEXT, WORD FOR WORD */}

        <Text style={styles.sectionTitle}>1. WHAT INFORMATION DO WE COLLECT?</Text>
        <Text style={styles.paragraph}>
          Personal information you disclose to us
        </Text>
        <Text style={styles.paragraph}>
          In Short: We collect personal information that you provide to us.
        </Text>
        <Text style={styles.paragraph}>
          We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
        </Text>
        <Text style={styles.paragraph}>
          Personal Information Provided by You. The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
        </Text>
        <Text style={styles.bulletPoints}>• names</Text>
        <Text style={styles.bulletPoints}>• email addresses</Text>
        <Text style={styles.bulletPoints}>• usernames</Text>
        <Text style={styles.bulletPoints}>• passwords</Text>
        <Text style={styles.bulletPoints}>• classes/semesters enrolled: to connect students within the same academic context.</Text>
        <Text style={styles.bulletPoints}>• major or area of study: for personalized group recommendations.</Text>
        <Text style={styles.bulletPoints}>• year of study (e.g., freshman, sophomore): to group students by experience level.</Text>
        <Text style={styles.bulletPoints}>• profile picture (optional)</Text>
        <Text style={styles.bulletPoints}>• age (to verify over 18)</Text>

        <Text style={styles.paragraph}>
          Sensitive Information. When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information:
        </Text>
        <Text style={styles.bulletPoints}>• student data</Text>

        <Text style={styles.paragraph}>
          Application Data. If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
        </Text>
        <Text style={styles.bulletPoints}>
          • Mobile Device Access. We may request access or permission to certain features from your mobile device, including your mobile device's storage, photos, and other features. If you wish to change our access or permissions, you may do so in your device's settings.
        </Text>
        <Text style={styles.bulletPoints}>
          • Push Notifications. We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device's settings.
        </Text>
        <Text style={styles.paragraph}>
          This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.
        </Text>
        <Text style={styles.paragraph}>
          All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
        </Text>

        <Text style={styles.sectionTitle}>2. HOW DO WE PROCESS YOUR INFORMATION?</Text>
        <Text style={styles.paragraph}>
          In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
        </Text>
        <Text style={styles.paragraph}>
          We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
        </Text>
        <Text style={styles.bulletPoints}>
          • To facilitate account creation and authentication and otherwise manage user accounts. We may process your information so you can create and log in to your account, as well as keep your account in working order.
        </Text>
        <Text style={styles.bulletPoints}>
          • To deliver and facilitate delivery of services to the user. We may process your information to provide you with the requested service.
        </Text>
        <Text style={styles.bulletPoints}>
          • To respond to user inquiries/offer support to users. We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
        </Text>
        <Text style={styles.bulletPoints}>
          • To send administrative information to you. We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.
        </Text>
        <Text style={styles.bulletPoints}>
          • To enable user-to-user communications. We may process your information if you choose to use any of our offerings that allow for communication with another user.
        </Text>
        <Text style={styles.bulletPoints}>
          • To request feedback. We may process your information when necessary to request feedback and to contact you about your use of our Services.
        </Text>
        <Text style={styles.bulletPoints}>
          • To evaluate and improve our Services, products, marketing, and your experience. We may process your information when we believe it is necessary to identify usage trends, determine the effectiveness of our promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.
        </Text>

        <Text style={styles.sectionTitle}>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</Text>
        <Text style={styles.paragraph}>
          In Short: We may share information in specific situations described in this section and/or with the following third parties.
        </Text>
        <Text style={styles.paragraph}>
          Vendors, Consultants, and Other Third-Party Service Providers. We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work.
        </Text>
        <Text style={styles.paragraph}>
          The third parties we may share personal information with are as follows:
        </Text>
        <Text style={styles.bulletPoints}>• Allow Users to Connect to Their Third-Party Accounts: Supabase</Text>
        <Text style={styles.bulletPoints}>• Communicate and Chat with Users: Supabase</Text>
        <Text style={styles.bulletPoints}>• User Account Registration and Authentication: Supabase</Text>
        <Text style={styles.bulletPoints}>• Website Performance Monitoring: Supabase</Text>
        <Text style={styles.bulletPoints}>• Website Testing: TestFlight</Text>

        <Text style={styles.paragraph}>
          We also may need to share your personal information in the following situations:
        </Text>
        <Text style={styles.bulletPoints}>
          • Business Transfers. We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
        </Text>
        <Text style={styles.bulletPoints}>
          • Other Users. When you share personal information (for example, by posting comments, contributions, or other content to the Services) or otherwise interact with public areas of the Services, such personal information may be viewed by all users and may be publicly made available outside the Services in perpetuity. Similarly, other users will be able to view descriptions of your activity, communicate with you within our Services, and view your profile.
        </Text>

        <Text style={styles.sectionTitle}>4. HOW LONG DO WE KEEP YOUR INFORMATION?</Text>
        <Text style={styles.paragraph}>
          In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
        </Text>
        <Text style={styles.paragraph}>
          We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
        </Text>
        <Text style={styles.paragraph}>
          When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
        </Text>

        <Text style={styles.sectionTitle}>5. HOW DO WE KEEP YOUR INFORMATION SAFE?</Text>
        <Text style={styles.paragraph}>
          In Short: We aim to protect your personal information through a system of organizational and technical security measures.
        </Text>
        <Text style={styles.paragraph}>
          We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
        </Text>

        <Text style={styles.sectionTitle}>6. DO WE COLLECT INFORMATION FROM MINORS?</Text>
        <Text style={styles.paragraph}>
          In Short: We do not knowingly collect data from or market to children under 18 years of age.
        </Text>
        <Text style={styles.paragraph}>
          We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at
          shreypathak022006@gmail.com.
        </Text>

        <Text style={styles.sectionTitle}>7. WHAT ARE YOUR PRIVACY RIGHTS?</Text>
        <Text style={styles.paragraph}>
          In Short: You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.
        </Text>
        <Text style={styles.paragraph}>
          Withdrawing your consent: If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
        </Text>
        <Text style={styles.paragraph}>
          However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
        </Text>
        <Text style={styles.paragraph}>
          Account Information
        </Text>
        <Text style={styles.paragraph}>
          If you would at any time like to review or change the information in your account or terminate your account, you can:
        </Text>
        <Text style={styles.paragraph}>
          Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
        </Text>

        <Text style={styles.sectionTitle}>8. CONTROLS FOR DO-NOT-TRACK FEATURES</Text>
        <Text style={styles.paragraph}>
          Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
        </Text>
        <Text style={styles.paragraph}>
          California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.
        </Text>

        <Text style={styles.sectionTitle}>9. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</Text>
        <Text style={styles.paragraph}>
          In Short: If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.
        </Text>
        <Text style={styles.paragraph}>
          Categories of Personal Information We Collect
        </Text>
        <Text style={styles.paragraph}>
          We have collected the following categories of personal information in the past twelve (12) months:
        </Text>

        <Text style={styles.paragraph}>
          Category A: Identifiers — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category B: Personal information as defined in the California Customer Records statute — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category C: Protected classification characteristics under state or federal law — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category D: Commercial information — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category E: Biometric information — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category F: Internet or other similar network activity — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category G: Geolocation data — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category H: Audio, electronic, sensory, or similar information — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category I: Professional or employment-related information — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category J: Education Information — Collected: NO
        </Text>
        <Text style={styles.paragraph}>
          Category K: Inferences drawn from collected personal information — Collected: YES
        </Text>
        <Text style={styles.paragraph}>
          Category L: Sensitive personal Information — Collected: YES
        </Text>

        <Text style={styles.paragraph}>
          We only collect sensitive personal information, as defined by applicable privacy laws or the purposes allowed by law or with your consent. Sensitive personal information may be used, or disclosed to a service provider or contractor, for additional, specified purposes. You may have the right to limit the use or disclosure of your sensitive personal information. We do not collect or process sensitive personal information for the purpose of inferring characteristics about you.
        </Text>

        <Text style={styles.paragraph}>
          We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:
        </Text>
        <Text style={styles.bulletPoints}>
          • Receiving help through our customer support channels;
        </Text>
        <Text style={styles.bulletPoints}>
          • Participation in customer surveys or contests; and
        </Text>
        <Text style={styles.bulletPoints}>
          • Facilitation in the delivery of our Services and to respond to your inquiries.
        </Text>

        <Text style={styles.paragraph}>
          We will use and retain the collected personal information as needed to provide the Services or for:
        </Text>
        <Text style={styles.bulletPoints}>• Category A - As long as the user has an account with us</Text>
        <Text style={styles.bulletPoints}>• Category B - As long as the user has an account with us</Text>
        <Text style={styles.bulletPoints}>• Category C - As long as the user has an account with us</Text>
        <Text style={styles.bulletPoints}>• Category J - As long as the user has an account with us</Text>
        <Text style={styles.bulletPoints}>• Category K - 6 months</Text>
        <Text style={styles.bulletPoints}>• Category L - As long as the user has an account with us</Text>

        <Text style={styles.paragraph}>
          Sources of Personal Information
        </Text>
        <Text style={styles.paragraph}>
          Learn more about the sources of personal information we collect in "WHAT INFORMATION DO WE COLLECT?"
        </Text>

        <Text style={styles.paragraph}>
          How We Use and Share Personal Information
        </Text>
        <Text style={styles.paragraph}>
          Learn more about how we use your personal information in the section, "HOW DO WE PROCESS YOUR INFORMATION?"
        </Text>

        <Text style={styles.paragraph}>
          Will your information be shared with anyone else?
        </Text>
        <Text style={styles.paragraph}>
          We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information to in the section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
        </Text>
        <Text style={styles.paragraph}>
          We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be "selling" of your personal information.
        </Text>
        <Text style={styles.paragraph}>
          We have not sold or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We have disclosed the following categories of personal information to third parties for a business or commercial purpose in the preceding twelve (12) months:
        </Text>
        <Text style={styles.paragraph}>
          [No specific categories listed in the text beyond the table above.]
        </Text>
        <Text style={styles.paragraph}>
          The categories of third parties to whom we disclosed personal information for a business or commercial purpose can be found under "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
        </Text>

        <Text style={styles.paragraph}>
          Your Rights
        </Text>
        <Text style={styles.paragraph}>
          You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to know whether or not we are processing your personal data
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to access your personal data
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to correct inaccuracies in your personal data
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to request the deletion of your personal data
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to obtain a copy of the personal data you previously shared with us
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to non-discrimination for exercising your rights
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to opt out of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California’s privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects ("profiling")
        </Text>
        <Text style={styles.paragraph}>
          Depending upon the state where you live, you may also have the following rights:
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to access the categories of personal data being processed (as permitted by applicable law, including Minnesota’s privacy law)
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including California's and Delaware's privacy law)
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including Minnesota's and Oregon's privacy law)
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to review, understand, question, and correct how personal data has been profiled (as permitted by applicable law, including Minnesota’s privacy law)
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including California’s privacy law)
        </Text>
        <Text style={styles.bulletPoints}>
          • Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including Florida’s privacy law)
        </Text>

        <Text style={styles.paragraph}>
          How to Exercise Your Rights
        </Text>
        <Text style={styles.paragraph}>
          To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at shreypathak022006@gmail.com, or by referring to the contact details at the bottom of this document.
        </Text>
        <Text style={styles.paragraph}>
          Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.
        </Text>

        <Text style={styles.paragraph}>
          Request Verification
        </Text>
        <Text style={styles.paragraph}>
          Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.
        </Text>
        <Text style={styles.paragraph}>
          If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request and the agent will need to provide a written and signed permission from you to submit such request on your behalf.
        </Text>

        <Text style={styles.paragraph}>
          Appeals
        </Text>
        <Text style={styles.paragraph}>
          Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at __________. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.
        </Text>

        <Text style={styles.paragraph}>
          California "Shine The Light" Law
        </Text>
        <Text style={styles.paragraph}>
          California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
        </Text>

        <Text style={styles.sectionTitle}>10. DATA HOSTING AND MANAGEMENT</Text>
        <Text style={styles.paragraph}>
          We use Supabase as our data hosting and management provider. Supabase is a secure platform that complies with industry-standard security measures to safeguard your personal data. For more information on Supabase’s security practices, please visit their website at https://supabase.com.
        </Text>

        <Text style={styles.sectionTitle}>11. DO WE MAKE UPDATES TO THIS NOTICE?</Text>
        <Text style={styles.paragraph}>
          In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.
        </Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
        </Text>

        <Text style={styles.sectionTitle}>12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</Text>
        <Text style={styles.paragraph}>
          If you have questions or comments about this notice, you may email us at
          shreypathak022006@gmail.com or contact us by post at:
        </Text>
        <Text style={styles.paragraph}>__________</Text>
        <Text style={styles.paragraph}>__________</Text>
        <Text style={styles.paragraph}>__________</Text>

        <Text style={styles.sectionTitle}>13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</Text>
        <Text style={styles.paragraph}>
          Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  date: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#000000',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333333',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#333333',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333333',
  },
  bulletPoints: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
    color: '#333333',
  },
  summary: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 16,
    color: '#333333',
  },
});

export default PrivacyPolicy;