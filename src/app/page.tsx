import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandName}>Safaricharger</span>
          </div>
          <nav className={styles.nav} aria-label="Primary">
            <a className={styles.navLink} href="/login">
              Login
            </a>
            <a className={styles.navLink} href="#">
              List chargers
            </a>
            <a className={styles.navLink} href="#">
              Status
            </a>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Web CMS</p>
              <h1 className={styles.title}>
                Manage charging stations with confidence.
              </h1>
              <p className={styles.subtitle}>
              Safaricharger Web Interface allows you to monitor chargers, manage
              stations, sessions, users, and operational health.
              </p>
              <div className={styles.ctaRow}>
                <a className={styles.primaryButton} href="/login">
                  Sign in
                </a>
                <a className={styles.secondaryButton} href="#capabilities">
                  Explore features
                </a>
              </div>
            </div>

            <div className={styles.preview} aria-label="Preview">
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Status</span>
                  <strong className={styles.metricValue}>Healthy</strong>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Stations</span>
                  <strong className={styles.metricValue}>—</strong>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Active sessions</span>
                  <strong className={styles.metricValue}>—</strong>
                </div>
              </div>

              <div className={styles.skeleton}>
                <div className={styles.skeletonRow}>
                  <div className={styles.skeletonBar} />
                  <div className={styles.skeletonBar} />
                  <div className={styles.skeletonBar} />
                </div>
                <div className={styles.skeletonRow}>
                  <div className={styles.skeletonBar} />
                  <div className={styles.skeletonBar} />
                  <div className={styles.skeletonBar} />
                </div>
              </div>

              <p className={styles.previewHint}>
                Get real time info on the status of your chargers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="quick-actions">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick actions</h2>
            <p className={styles.sectionSubtitle}>
              Jump straight into the most common operator workflows.
            </p>
          </div>

          <div className={styles.cardGrid}>
            <a className={styles.card} href="/stations">
              <h3 className={styles.cardTitle}>Stations</h3>
              <p className={styles.cardText}>
                View your chargers, connectors, availability, and faults.
              </p>
            </a>
            <a className={styles.card} href="/sessions">
              <h3 className={styles.cardTitle}>Charging sessions</h3>
              <p className={styles.cardText}>
                Manage ongoing sessions and other operational events.
              </p>
            </a>
            <a className={styles.card} href="/users">
              <h3 className={styles.cardTitle}>Users & access</h3>
              <p className={styles.cardText}>
                Manage your organization users, roles, and permissions.
              </p>
            </a>
          </div>
        </div>
      </section>

      <section id="capabilities">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What you can manage</h2>
            <p className={styles.sectionSubtitle}>
              Safaricharger gives you one place to understand how your network is
              performing and act on it.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Network overview</h3>
              <p className={styles.featureText}>
                See every station at a glance: online status, utilization, and
                faulted connectors.
              </p>
            </div>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Sessions & revenue</h3>
              <p className={styles.featureText}>
                Follow charging sessions from start to stop, and tie usage back to
                energy delivered and revenue.
              </p>
            </div>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Teams & access</h3>
              <p className={styles.featureText}>
                Keep operations, support, and partners in sync with roles and
                permissions that match how you work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="status">
        <div className={styles.container}>
          <div className={styles.statusRow}>
            <div className={styles.statusCopy}>
              <h2 className={styles.sectionTitle}>See the bigger picture</h2>
              <p className={styles.sectionSubtitle}>
                Safaricharger provides visibility into reports, transactions, and charge boxes on a
                map so you always know what&apos;s happening across your stations.
              </p>
            </div>

            <div className={styles.pills}>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Reports</span>
                <strong className={styles.pillValue}>Usage & performance</strong>
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Transactions</span>
                <strong className={styles.pillValue}>Sessions & payments</strong>
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Charge boxes</span>
                <strong className={styles.pillValue}>Live map view</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© {new Date().getFullYear()} Safaricharger</span>
          <span className={styles.footerMeta}>Web CMS</span>
        </div>
      </footer>
    </main>
  );
}
