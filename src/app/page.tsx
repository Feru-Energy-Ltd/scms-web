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
            <a className={styles.navLink} href="#quick-actions">
              Quick actions
            </a>
            <a className={styles.navLink} href="#capabilities">
              Capabilities
            </a>
            <a className={styles.navLink} href="#status">
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
              Safaricharger is the web interface for monitoring chargers, managing
              stations, sessions, users, pricing, and operational health.
              </p>
              <div className={styles.ctaRow}>
                <a className={styles.primaryButton} href="#quick-actions">
                  Open dashboard
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
                Connect your backend to populate real-time metrics and station
                status.
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
                View chargers, connectors, availability, and faults.
              </p>
            </a>
            <a className={styles.card} href="/sessions">
              <h3 className={styles.cardTitle}>Charging sessions</h3>
              <p className={styles.cardText}>
                Search sessions, refunds, and operational events.
              </p>
            </a>
            <a className={styles.card} href="/users">
              <h3 className={styles.cardTitle}>Users & access</h3>
              <p className={styles.cardText}>
                Roles, permissions, and operator accounts.
              </p>
            </a>
            <a className={styles.card} href="/settings">
              <h3 className={styles.cardTitle}>Pricing & settings</h3>
              <p className={styles.cardText}>
                Tariffs, site metadata, and integrations.
              </p>
            </a>
          </div>
        </div>
      </section>

      <section id="capabilities">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for operations</h2>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Station health</h3>
              <p className={styles.featureText}>
                Track uptime, alerts, and connector-level faults.
              </p>
            </div>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Session insights</h3>
              <p className={styles.featureText}>
                Energy delivered, revenue, and usage by site.
              </p>
            </div>
            <div className={styles.feature}>
              <h3 className={styles.featureTitle}>Remote actions</h3>
              <p className={styles.featureText}>
                Start/stop sessions and manage availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="status">
        <div className={styles.container}>
          <div className={styles.statusRow}>
            <div className={styles.statusCopy}>
              <h2 className={styles.sectionTitle}>Ready when you are</h2>
              <p className={styles.sectionSubtitle}>
              This homepage is a clean starting point. Hook it up to your API and
              we’ll turn the placeholders into live data.
              </p>
            </div>

            <div className={styles.pills}>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Theme</span>
                <strong className={styles.pillValue}>Light/Dark</strong>
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Primary</span>
                <strong className={styles.pillValue}>#01b763</strong>
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Build</span>
                <strong className={styles.pillValue}>Next.js App Router</strong>
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
