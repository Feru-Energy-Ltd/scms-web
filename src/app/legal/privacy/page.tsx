import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy · Safaricharge",
  description:
    "Privacy policy for SafariCharge and the Charging Stations Management System.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/assets/logo.png"
                alt=""
                width={112}
                height={40}
                className={styles.brandLogo}
                priority
              />
            </span>
            <span className={styles.brandName}>Safaricharge</span>
          </Link>
        </div>

        <header className={styles.intro}>
          <h1 className={styles.pageTitle}>Privacy Policy</h1>
          <p className={styles.updated}>Effective date: March 2026</p>
        </header>

        <Section title="Introduction">
          <p className={styles.paragraph}>
            Welcome to SafariCharge, a product of Feru Energy Ltd. This privacy policy governs your use of the SafariCharge website, mobile
            application and the Charging Stations Management System
            (collectively referred to as the &quot;Services&quot;). By using the
            Services, you agree to comply with and be bound by this privacy policy.
          </p>
        </Section>

        <Section title="Definitions">
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span className={styles.termLabel}>&quot;We,&quot; &quot;us,&quot; &quot;our&quot;:</span>{" "}
              Refers to Feru Energy Ltd.
            </li>
            <li className={styles.listItem}>
              <span className={styles.termLabel}>&quot;You,&quot; &quot;your,&quot; &quot;user&quot;:</span>{" "}
              Refers to the individual or entity using the Services.
            </li>
            <li className={styles.listItem}>
              <span className={styles.termLabel}>&quot;Services&quot;:</span> Refers to the
              SafariCharge website, mobile application and Charging Stations Management
              System.
            </li>
            <li className={styles.listItem}>
              <span className={styles.termLabel}>&quot;Charging Station&quot;:</span> Refers to
              the electric vehicle charging infrastructure managed by
              SafariCharge.
            </li>
          </ul>
        </Section>

        <Section title="Use of Services">
          <h3 className={styles.subTitle}>Eligibility</h3>
          <p className={styles.paragraph}>
            You must be at least 18 years old to use our Services. By using our
            Services, you represent and warrant that you meet this age
            requirement.
          </p>

          <h3 className={styles.subTitle}>Account Registration</h3>
          <p className={styles.paragraph}>
            To access certain features of the Services, you may need to register
            for an account. You agree to provide accurate, current, and complete
            information during the registration process and to update such
            information to keep it accurate, current, and complete.
          </p>

          <h3 className={styles.subTitle}>Account Security</h3>
          <p className={styles.paragraph}>
            You are responsible for safeguarding your account credentials. You
            agree not to disclose your password to any third party and to notify
            us immediately of any unauthorized use of your account.
          </p>
        </Section>

        <Section title="Service Usage">
          <h3 className={styles.subTitle}>Website</h3>
          <p className={styles.paragraph}>
            The SafariCharge website provides users with access to
            information about charging stations, tools to manage chargers at your stations,status dashboards, and other related features.
          </p>

          <h3 className={styles.subTitle}>
            Charging Stations Management System (CSMS)
          </h3>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              The Charging Stations Management System allows charging station
              owners to monitor and manage their charging infrastructure.
            </li>
            <li className={styles.listItem}>
              You agree to use the management system in accordance with the
              instructions provided and to maintain the confidentiality of any
              login credentials.
            </li>
          </ul>
          <h3 className={styles.subTitle}>Mobile Application</h3>
          <p className={styles.paragraph}>
            The SafariCharge mobile app provides users with access to
            information about charging stations availability, reservation, payment options and other related features. By using the app, you agree to comply with the terms and conditions of the app.
          </p>


        </Section>

        <Section title="Payments and Fees">
          <h3 className={styles.subTitle}>Charging Fees</h3>
          <p className={styles.paragraph}>
            The fees for using the charging stations will be displayed in the
            SafariCharge mobile app. You agree to pay all fees associated with
            the use of the charging stations as indicated in the app.
          </p>

          <h3 className={styles.subTitle}>Subscription Fees</h3>
          <p className={styles.paragraph}>
            Certain features of the Charging Stations Management System may
            require a subscription. Subscription fees will be clearly
            communicated to you, and you agree to pay these fees in accordance
            with the subscription terms.
          </p>
        </Section>

        <Section title="User Conduct">
          <h3 className={styles.subTitle}>Prohibited Activities</h3>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              Using the Services for any illegal or unauthorized purpose.
            </li>
            <li className={styles.listItem}>
              Tampering with or circumventing any security measures of the
              Services.
            </li>
            <li className={styles.listItem}>
              Interfering with or disrupting the integrity or performance of the
              Services.
            </li>
          </ul>

          <h3 className={styles.subTitle}>User Content</h3>
          <p className={styles.paragraph}>
            You are solely responsible for any content you post, upload, or
            otherwise make available through the Services. You agree not to post
            content that is unlawful, offensive, or infringes on the rights of
            others.
          </p>
        </Section>

        <Section title="Privacy">
          <p className={styles.paragraph}>
            We collect and process personal information necessary to provide and
            improve the Services, including account details, contact
            information, charging session data, and usage information. We use
            this data to operate the Services, process payments, provide
            support, and meet legal obligations.
          </p>
          <p className={styles.paragraph}>
            We do not sell your personal information. We may share data with
            service providers who help us operate and regulate the Services, and when
            required by law. You may contact us to request access to, correction
            of, or deletion of your personal information, subject to applicable
            law.
          </p>
        </Section>

        <Section title="Intellectual Property">
          <h3 className={styles.subTitle}>Ownership</h3>
          <p className={styles.paragraph}>
            All intellectual property rights in the Services, including but not
            limited to software, design, and content, are owned by Feru Energy
            Ltd. You agree not to reproduce, distribute, or create derivative
            works based on our intellectual property without our explicit
            permission.
          </p>

          <h3 className={styles.subTitle}>License</h3>
          <p className={styles.paragraph}>
            Subject to your compliance with these terms, we grant you a limited,
            non-exclusive, non-transferable, and revocable license to use the
            Services.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p className={styles.paragraph}>
            To the maximum extent permitted by law, Feru Energy Ltd shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenues, whether
            incurred directly or indirectly, or any loss of data, use, goodwill,
            or other intangible losses, resulting from:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              Your use or inability to use the Services.
            </li>
            <li className={styles.listItem}>
              Any unauthorized access to or use of our servers and/or any
              personal information stored therein.
            </li>
            <li className={styles.listItem}>
              Any interruption or cessation of transmission to or from the
              Services.
            </li>
          </ul>
        </Section>

        <Section title="Indemnification">
          <p className={styles.paragraph}>
            You agree to indemnify and hold harmless Feru Energy Ltd, its
            affiliates, and their respective officers, directors, employees, and
            agents from and against any claims, liabilities, damages, losses,
            and expenses, including, without limitation, reasonable legal and
            accounting fees, arising out of or in any way connected with your
            access to or use of the Services or your violation of these terms.
          </p>
        </Section>

        <Section title="Termination">
          <p className={styles.paragraph}>
            We may terminate or suspend your access to the Services at any time,
            without prior notice or liability, for any reason whatsoever,
            including, without limitation, if you breach these terms. Upon
            termination, your right to use the Services will immediately cease.
          </p>
        </Section>

        <Section title="Governing Law">
          <p className={styles.paragraph}>
            These terms shall be governed and construed in accordance with the
            laws of Rwanda, without regard to its conflict of law provisions.
          </p>
        </Section>

        <Section title="Changes to Terms">
          <p className={styles.paragraph}>
            We reserve the right, at our sole discretion, to modify or replace
            these terms at any time. If a revision is material, we will provide
            at least 30 days&apos; notice prior to any new terms taking effect.
            What constitutes a material change will be determined at our sole
            discretion.
          </p>
        </Section>

        <Section title="Contact Us">
          <div className={styles.contactCard}>
            <p className={styles.paragraph}>
              If you have any questions about these terms or our privacy
              practices, please contact us at:
            </p>
            <div className={styles.contactRow}>
              <a
                className={styles.contactLink}
                href="mailto:support@safaricharge.com"
              >
                support@safaricharge.com
              </a>
              <a className={styles.contactLink} href="tel:+250788314509">
                +250 788 314509
              </a>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
