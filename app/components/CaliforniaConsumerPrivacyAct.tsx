import React from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// CCPA Component
const CCPA = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.mainTitle}>CALIFORNIA CONSUMER PRIVACY ACT (CCPA) PRIVACY NOTICE</Text>
        <Text style={styles.date}>Last Updated: January 31, 2025</Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          This CCPA Privacy Notice supplements the Semster Privacy Policy and applies specifically to California residents ("consumers" or "you"). This notice explains our practices regarding the collection, use, and disclosure of personal information under the California Consumer Privacy Act of 2018 (CCPA).
        </Text>

        <Text style={styles.sectionTitle}>Categories of Personal Information We Collect and Use</Text>
        <Text style={styles.paragraph}>
          In the past 12 months, Semster has collected the following categories of personal information:
        </Text>

        <Text style={styles.subTitle}>A. Identifiers</Text>
        <Text style={styles.bulletPoints}>• Name</Text>
        <Text style={styles.bulletPoints}>• Email address</Text>
        <Text style={styles.bulletPoints}>• Username</Text>
        <Text style={styles.bulletPoints}>• Account login credentials</Text>
        <Text style={styles.bulletPoints}>• Device identifiers</Text>
        <Text style={styles.bulletPoints}>• IP address</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.subTitle}>B. Personal Information (Cal. Civ. Code § 1798.80(e))</Text>
        <Text style={styles.bulletPoints}>• Education information</Text>
        <Text style={styles.bulletPoints}>• Student records</Text>
        <Text style={styles.bulletPoints}>• Profile information</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.subTitle}>C. Protected Classifications</Text>
        <Text style={styles.bulletPoints}>• Age (to verify over 18)</Text>
        <Text style={styles.status}>Collection Status: YES (Limited)</Text>

        <Text style={styles.subTitle}>D. Commercial Information</Text>
        <Text style={styles.bulletPoints}>• None collected</Text>
        <Text style={styles.status}>Collection Status: NO</Text>

        <Text style={styles.subTitle}>E. Biometric Information</Text>
        <Text style={styles.bulletPoints}>• None collected</Text>
        <Text style={styles.status}>Collection Status: NO</Text>

        <Text style={styles.subTitle}>F. Internet Activity</Text>
        <Text style={styles.bulletPoints}>• App usage information</Text>
        <Text style={styles.bulletPoints}>• User interactions</Text>
        <Text style={styles.bulletPoints}>• Session duration</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.subTitle}>G. Geolocation Data</Text>
        <Text style={styles.bulletPoints}>• None collected</Text>
        <Text style={styles.status}>Collection Status: NO</Text>

        <Text style={styles.subTitle}>H. Sensory Information</Text>
        <Text style={styles.bulletPoints}>• Profile pictures (optional)</Text>
        <Text style={styles.status}>Collection Status: YES (Optional)</Text>

        <Text style={styles.subTitle}>I. Professional Information</Text>
        <Text style={styles.bulletPoints}>• Major/field of study</Text>
        <Text style={styles.bulletPoints}>• Year of study</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.subTitle}>J. Education Information</Text>
        <Text style={styles.bulletPoints}>• Classes enrolled</Text>
        <Text style={styles.bulletPoints}>• Academic context</Text>
        <Text style={styles.bulletPoints}>• Study preferences</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.subTitle}>K. Inferences</Text>
        <Text style={styles.bulletPoints}>• Study preferences</Text>
        <Text style={styles.bulletPoints}>• Group compatibility</Text>
        <Text style={styles.bulletPoints}>• Learning patterns</Text>
        <Text style={styles.status}>Collection Status: YES</Text>

        <Text style={styles.sectionTitle}>How We Use Personal Information</Text>
        <Text style={styles.paragraph}>We use the collected personal information for:</Text>
        <Text style={styles.bulletPoints}>1. Providing our educational platform services</Text>
        <Text style={styles.bulletPoints}>2. Creating and managing user accounts</Text>
        <Text style={styles.bulletPoints}>3. Facilitating student connections and study groups</Text>
        <Text style={styles.bulletPoints}>4. Personalizing user experience</Text>
        <Text style={styles.bulletPoints}>5. Improving our services</Text>
        <Text style={styles.bulletPoints}>6. Maintaining platform security</Text>
        <Text style={styles.bulletPoints}>7. Communications about services</Text>
        <Text style={styles.bulletPoints}>8. Technical support</Text>

        <Text style={styles.sectionTitle}>Disclosure of Personal Information</Text>
        <Text style={styles.subTitle}>Third-Party Sharing</Text>
        <Text style={styles.paragraph}>We share information with:</Text>
        <Text style={styles.bulletPoints}>• Supabase (data hosting and authentication)</Text>
        <Text style={styles.bulletPoints}>• TestFlight (app testing)</Text>
        <Text style={styles.paragraph}>
          We do NOT sell personal information of any users, including minors under 16 years old.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights Under CCPA</Text>
        <Text style={styles.subTitle}>1. Right to Know</Text>
        <Text style={styles.bulletPoints}>• Request what personal information we collect</Text>
        <Text style={styles.bulletPoints}>• Learn how we use and share your information</Text>
        <Text style={styles.bulletPoints}>• Receive information about data collection practices</Text>

        <Text style={styles.subTitle}>2. Right to Delete</Text>
        <Text style={styles.bulletPoints}>• Request deletion of your personal information</Text>
        <Text style={styles.bulletPoints}>• Some exceptions apply for necessary data retention</Text>

        <Text style={styles.subTitle}>3. Right to Opt-Out</Text>
        <Text style={styles.bulletPoints}>• Opt-out of personal information sales (Note: Semster does not sell personal information)</Text>

        <Text style={styles.subTitle}>4. Right to Non-Discrimination</Text>
        <Text style={styles.bulletPoints}>• Receive equal service and pricing even if you exercise your privacy rights</Text>

        <Text style={styles.sectionTitle}>How to Exercise Your Rights</Text>
        <Text style={styles.subTitle}>1. Submit a Request</Text>
        <Text style={styles.bulletPoints}>• Email: shreypathak022006@gmail.com</Text>
        <Text style={styles.bulletPoints}>• In-App: Access privacy settings</Text>
        <Text style={styles.bulletPoints}>• Response Time: Within 45 days</Text>

        <Text style={styles.subTitle}>2. Verification Process</Text>
        <Text style={styles.paragraph}>We will verify your identity through:</Text>
        <Text style={styles.bulletPoints}>• Account verification</Text>
        <Text style={styles.bulletPoints}>• Email confirmation</Text>
        <Text style={styles.bulletPoints}>• Identity documentation (if necessary)</Text>

        <Text style={styles.subTitle}>3. Authorized Agents</Text>
        <Text style={styles.paragraph}>
          You may designate an authorized agent. Agents must provide written authorization. We may require direct identity verification.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.paragraph}>We retain personal information for:</Text>
        <Text style={styles.bulletPoints}>• Account Duration: Most personal information</Text>
        <Text style={styles.bulletPoints}>• Security Purposes: Up to 24 months for security logs</Text>
        <Text style={styles.bulletPoints}>• Legal Requirements: As required by law</Text>

        <Text style={styles.sectionTitle}>Updates to This Notice</Text>
        <Text style={styles.paragraph}>
          We reserve the right to update this CCPA Notice. Changes will be posted with a new "Last Updated" date. Material changes will be notified through:
        </Text>
        <Text style={styles.bulletPoints}>• Email notification</Text>
        <Text style={styles.bulletPoints}>• App notification</Text>
        <Text style={styles.bulletPoints}>• Website announcement</Text>

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.paragraph}>For CCPA-related inquiries:</Text>
        <Text style={styles.bulletPoints}>• Email: shreypathak022006@gmail.com</Text>
        <Text style={styles.bulletPoints}>• Address: [Semster Physical Address]</Text>
        <Text style={styles.bulletPoints}>• Privacy Team Contact: [Privacy Team Contact Details]</Text>

        <Text style={styles.sectionTitle}>Additional California Privacy Rights</Text>
        <Text style={styles.subTitle}>Shine the Light Law</Text>
        <Text style={styles.paragraph}>
          California residents can request information about personal information shared with third parties for direct marketing. Contact us at shreypathak022006@gmail.com for such requests.
        </Text>

        <Text style={styles.subTitle}>California Privacy Rights</Text>
        <Text style={styles.paragraph}>You have the right to:</Text>
        <Text style={styles.bulletPoints}>1. Know the categories of personal information collected</Text>
        <Text style={styles.bulletPoints}>2. Know the categories of sources of information</Text>
        <Text style={styles.bulletPoints}>3. Know the purpose for collecting information</Text>
        <Text style={styles.bulletPoints}>4. Know the categories of third parties with whom we share</Text>
        <Text style={styles.bulletPoints}>5. Know the specific pieces of personal information collected</Text>
        <Text style={styles.bulletPoints}>6. Delete personal information (with exceptions)</Text>
        <Text style={styles.bulletPoints}>7. Non-discrimination for exercising rights</Text>

        <Text style={styles.sectionTitle}>Verification of Requests</Text>
        <Text style={styles.paragraph}>To protect your privacy, we will verify all requests by:</Text>
        <Text style={styles.bulletPoints}>1. Confirming email address</Text>
        <Text style={styles.bulletPoints}>2. Verifying account ownership</Text>
        <Text style={styles.bulletPoints}>3. Requesting additional information if needed</Text>
        <Text style={styles.paragraph}>
          We may deny requests if we cannot verify your identity.
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
  status: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});

export default CCPA;
